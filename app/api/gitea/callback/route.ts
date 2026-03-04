import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    const baseUrl = process.env.GITEA_BASE_URL;
    const clientId = process.env.GITEA_CLIENT_ID;
    const clientSecret = process.env.GITEA_CLIENT_SECRET;
    const redirectUri = process.env.GITEA_REDIRECT_URI;

    if (!baseUrl || !clientId || !clientSecret || !redirectUri) {
        return NextResponse.json({ error: 'Gitea OAuth not configured' }, { status: 500 });
    }

    try {
        // Exchange code for token
        const tokenRes = await fetch(`${baseUrl}/login/oauth/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error('Gitea token exchange failed:', errText);
            return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;

        if (!accessToken) {
            return NextResponse.json({ error: 'No access token returned' }, { status: 500 });
        }

        // Get Gitea user info
        const userRes = await fetch(`${baseUrl}/api/v1/user`, {
            headers: { 'Authorization': `token ${accessToken}` },
        });
        const giteaUser = await userRes.json();

        // Store token in database
        await prisma.user.update({
            where: { clerkId: userId },
            data: {
                giteaAccessToken: accessToken,
                giteaRefreshToken: refreshToken || null,
                giteaUsername: giteaUser.login || null,
            },
        });

        // Redirect back to projects page with success
        return NextResponse.redirect(new URL('/dashboard/projects?gitea=connected', req.url));
    } catch (error: any) {
        console.error('Gitea OAuth callback error:', error);
        return NextResponse.redirect(new URL('/dashboard/projects?gitea=error', req.url));
    }
}
