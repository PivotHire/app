import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Use the internal docker network hostname "openinary" and its internal port 3000
        const openinaryUrl = process.env.OPENINARY_INTERNAL_URL || "http://openinary:3000";
        const openinaryApiKey = process.env.OPENINARY_API_KEY;

        if (!openinaryApiKey) {
            return NextResponse.json(
                { error: "Openinary config missing" },
                { status: 500 }
            );
        }

        // Forward the file as 'files' based on Openinary docs
        const uploadData = new FormData();
        uploadData.append("files", file);

        // Optional: Extract a specific path/name from request if we want
        const destName = formData.get("name");
        if (destName) {
            uploadData.append("names", destName);
        }

        const response = await fetch(`${openinaryUrl}/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openinaryApiKey}`,
            },
            body: uploadData as unknown as BodyInit,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Openinary upload returned error:", response.status, errorText);
            return NextResponse.json(
                { error: "Upload failed to destination" },
                { status: response.status }
            );
        }

        const result = await response.json();

        // Safeguard to ensure internal docker URL doesn't leak to public clients
        if (result.files && Array.isArray(result.files)) {
            result.files = result.files.map((f: any) => {
                if (f.url && f.url.includes("openinary:3000")) {
                    f.url = f.url.replace(/http:\/\/openinary:3000/g, "https://openinary.pivothire.tech");
                }
                return f;
            });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error in upload API route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
