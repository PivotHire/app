# Avatar Upload Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Add avatar/logo upload functionality to Talent and Business profiles, uploading immediately on file selection via a Next.js proxy to Openinary, and storing the URL in the database.

**Architecture:** Mocks the avatar upload using a new Next.js route `/api/upload` that attaches the `OPENINARY_API_KEY` and forwards multipart form-data to the Openinary server (`localhost:3002`). The client component initiates the upload immediately upon file selection. The form submits the returned URL to the database when saving.

**Tech Stack:** Next.js, Prisma, Tailwind, Zod, React Hook Form, Openinary

---

### Task 1: Update Database Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add avatar fields**

In `prisma/schema.prisma`, add `logoUrl` to `BusinessProfile` and `avatarUrl` to `TalentProfile`.

```prisma
model BusinessProfile {
  // ... existing fields ...
  logoUrl        String?
  // ... existing fields ...
}

model TalentProfile {
  // ... existing fields ...
  avatarUrl      String?
  // ... existing fields ...
}
```

**Step 2: Apply Database Changes**

Run: `npx prisma db push`
Expected: Database syncs successfully and Prisma client is generated.

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add logoUrl and avatarUrl to profiles"
```

---

### Task 2: Create Next.js Proxy Upload Route

**Files:**
- Create: `app/api/upload/route.ts`

**Step 1: Write Route Implementation**

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const openinaryUrl = process.env.OPENINARY_BASE_URL || "http://localhost:3002";
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
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in upload API route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

**Step 2: Test basic availability via curl**

Run: `curl -X POST -F "file=fake" http://localhost:3000/api/upload` (when app is running) or rely on manual UI testing if app must be running. We will test it directly via the UI in later steps.

**Step 3: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat: add Next.js proxy route for Openinary uploads"
```

---

### Task 3: Create Reusable ImageUpload Component

**Files:**
- Create: `components/ui/image-upload.tsx`

**Step 1: Write Component**

Create a wrapper around an `input type="file"` that displays the current image, provides a drag-and-drop or click area, and handles the `fetch` POST to `/api/upload` immediately on selection, calling `onChange(url)` when it finishes. Use `lucide-react` icons (e.g. `UploadCloud`, `Loader2`) and `sonner` toast for errors.

**Step 2: Commit**

```bash
git add components/ui/image-upload.tsx
git commit -m "feat: reusable ImageUpload ui component"
```

---

### Task 4: Integrate with BusinessProfileForm

**Files:**
- Modify: `app/dashboard/profile/_components/BusinessProfileForm.tsx`

**Step 1: Update Schema and Default Values**

Add `logoUrl: z.string().optional()` to `businessSchema`. Include it in `defaultValues`.

**Step 2: Replace Stub with ImageUpload**

Replace the hardcoded SVG stub in the "Company logo" section with the `<ImageUpload>` component, hooked up to the react-hook-form using either `<Controller>` or direct `form.setValue("logoUrl", url, { shouldDirty: true })`. Show the existing logo in the header and the avatar circle if one is saved.

**Step 3: Verify TypeScript Types and Components**
Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 4: Commit**

```bash
git add app/dashboard/profile/_components/BusinessProfileForm.tsx
git commit -m "feat: integrate ImageUpload into BusinessProfileForm"
```

---

### Task 5: Integrate with TalentProfileForm

**Files:**
- Modify: `app/dashboard/profile/_components/TalentProfileForm.tsx`

**Step 1: Update Schema and component**

Add `avatarUrl: z.string().optional()` to the schema, similarly swapping out the "Profile Picture" section with the `<ImageUpload>`. Show the avatar in the visual header block.

**Step 2: Verify application builds**
Run: `npm run build`
Expected: Build passes with no type errors.

**Step 3: Commit**

```bash
git add app/dashboard/profile/_components/TalentProfileForm.tsx
git commit -m "feat: integrate ImageUpload into TalentProfileForm"
```
