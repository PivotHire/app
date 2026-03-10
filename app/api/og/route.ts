import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                // Mimic a typical browser to avoid simple bot blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch the URL: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();

        const getMetaTag = (property: string) => {
            // Check for property="..."
            const regexProp = new RegExp(`<meta(?:[^>]*)property=["']${property}["'](?:[^>]*)content=["']([^"']*)["']`, 'i');
            const matchProp = html.match(regexProp);
            if (matchProp) return matchProp[1];

            // Check for content="..." property="..."
            const regexProp2 = new RegExp(`<meta(?:[^>]*)content=["']([^"']*)["'](?:[^>]*)property=["']${property}["']`, 'i');
            const matchProp2 = html.match(regexProp2);
            if (matchProp2) return matchProp2[1];

            // Fallback to name="..." instead of property="..."
            const regexName = new RegExp(`<meta(?:[^>]*)name=["']${property}["'](?:[^>]*)content=["']([^"']*)["']`, 'i');
            const matchName = html.match(regexName);
            if (matchName) return matchName[1];

            // Fallback for content="..." name="..."
            const regexName2 = new RegExp(`<meta(?:[^>]*)content=["']([^"']*)["'](?:[^>]*)name=["']${property}["']`, 'i');
            const matchName2 = html.match(regexName2);
            return matchName2 ? matchName2[1] : null;
        };

        const getTitle = () => {
            const ogTitle = getMetaTag('og:title');
            if (ogTitle) return ogTitle;
            const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
            return titleMatch ? titleMatch[1] : url;
        };

        const title = getTitle();
        let description = getMetaTag('og:description') || getMetaTag('description') || '';
        let image = getMetaTag('og:image') || '';

        // Decode basic HTML entities for cleaner text
        description = description.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

        // Resolve relative image URLs if necessary
        if (image && !image.startsWith('http')) {
            try {
                const baseUrl = new URL(url);
                image = new URL(image, baseUrl.origin).toString();
            } catch (e) {
                // ignore
            }
        }

        return NextResponse.json({ title, description, image });
    } catch (error) {
        console.error('Error fetching OG data for URL:', url, error);
        return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
    }
}
