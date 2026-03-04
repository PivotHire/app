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

    if (!owner || !repo) {
        return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
    }

    // Get user's Gitea token from DB
    const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { giteaAccessToken: true },
    });

    const baseUrl = process.env.GITEA_BASE_URL;
    if (!baseUrl) {
        return NextResponse.json({ error: 'Gitea not configured' }, { status: 500 });
    }

    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };

    // Use user token if available, otherwise try without auth (public repos)
    if (dbUser?.giteaAccessToken) {
        headers['Authorization'] = `token ${dbUser.giteaAccessToken}`;
    }

    try {
        // First get the repo info to get the default branch SHA
        const repoRes = await fetch(`${baseUrl}/api/v1/repos/${owner}/${repo}`, { headers });
        if (!repoRes.ok) {
            const text = await repoRes.text();
            return NextResponse.json(
                { error: `Failed to fetch repo info: ${repoRes.status} ${text}` },
                { status: repoRes.status }
            );
        }
        const repoData = await repoRes.json();
        const defaultBranch = repoData.default_branch || 'main';

        // Get the branch ref to find the tree SHA
        const branchRes = await fetch(
            `${baseUrl}/api/v1/repos/${owner}/${repo}/branches/${defaultBranch}`,
            { headers }
        );
        if (!branchRes.ok) {
            return NextResponse.json(
                { error: `Failed to fetch branch: ${branchRes.status}` },
                { status: branchRes.status }
            );
        }
        const branchData = await branchRes.json();
        const treeSha = branchData.commit?.id || branchData.commit?.sha;

        if (!treeSha) {
            return NextResponse.json({ error: 'Could not find tree SHA' }, { status: 500 });
        }

        // Get the full tree recursively
        const treeRes = await fetch(
            `${baseUrl}/api/v1/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=true`,
            { headers }
        );
        if (!treeRes.ok) {
            return NextResponse.json(
                { error: `Failed to fetch tree: ${treeRes.status}` },
                { status: treeRes.status }
            );
        }

        const treeData = await treeRes.json();
        return NextResponse.json(treeData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
