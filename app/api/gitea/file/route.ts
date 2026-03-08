import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path');

    if (!owner || !repo || !path) {
        return NextResponse.json({ error: 'Missing owner, repo, or path' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { giteaAccessToken: true },
    });

    const baseUrl = process.env.GITEA_BASE_URL;
    if (!baseUrl) {
        return NextResponse.json({ error: 'Gitea not configured' }, { status: 500 });
    }

    const headers: Record<string, string> = {};
    if (dbUser?.giteaAccessToken) {
        headers['Authorization'] = `token ${dbUser.giteaAccessToken}`;
    }

    try {
        // First get default branch
        const repoRes = await fetch(`${baseUrl}/api/v1/repos/${owner}/${repo}`, {
            headers: { ...headers, 'Accept': 'application/json' },
        });
        if (!repoRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch repo' }, { status: repoRes.status });
        }
        const repoData = await repoRes.json();
        const branch = repoData.default_branch || 'main';

        // Get raw file content
        const fileRes = await fetch(
            `${baseUrl}/api/v1/repos/${owner}/${repo}/raw/${branch}/${path}`,
            { headers }
        );

        if (!fileRes.ok) {
            return NextResponse.json(
                { error: `Failed to fetch file: ${fileRes.status}` },
                { status: fileRes.status }
            );
        }

        const buffer = await fileRes.arrayBuffer();
        const contentType = fileRes.headers.get('Content-Type') || 'application/octet-stream';

        return new NextResponse(buffer, {
            headers: { 'Content-Type': contentType },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
