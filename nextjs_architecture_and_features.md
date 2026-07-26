# Next.js App Router Architecture & Core Features

This document explains the Next.js App Router architecture, rendering strategies, API route patterns, and core features utilized in the **AI Resume Analyzer**.

---

## 1. App Router Folder Hierarchy

Next.js uses a file-system based router where folders define routes. Here is the project's folder layout:

```
app/
├── (auth)/                 # Route Group for authentication modals/pages
├── api/                    # Server-side API Route Handlers
│   ├── analyze-resume/     # POST endpoint for document parsing & AI processing
│   │   └── route.ts
│   ├── my-resumes/         # GET (list) & DELETE (remove) resume endpoints
│   │   └── route.ts
│   └── uploadthing/        # UploadThing webhook & signed URL generator
│       └── route.ts
├── components/             # Reusable UI Components
│   ├── Dashboard.tsx       # Main interactive command center
│   ├── Navbar.tsx          # Top navigation bar & Clerk user controls
│   └── SignInModal.tsx     # Modal popover wrapper for Clerk Sign-In
├── my-resumes/             # My Resumes route (renders Dashboard)
│   └── page.tsx
├── results/                # Server-rendered report page
│   ├── page.tsx            # Server Component fetching analysis data
│   └── PrintButton.tsx     # Client Component trigger for browser printing
├── upload/                 # Resume Upload page
│   └── page.tsx            # Interactive upload form with optional context fields
├── favicon.ico
├── globals.css             # Theme tokens, utilities, and dark scrollbar styling
├── layout.tsx              # Root Layout wrapping Clerk Providers & Navbar
├── page.tsx                # Home page (renders Dashboard)
└── providers.tsx           # ClerkProvider wrapper
```

---

## 2. Next.js App Router Features Used

### A. Root Layout & Global Context Providers (`layout.tsx` & `providers.tsx`)
In Next.js App Router, `layout.tsx` wraps all sub-pages. It maintains persistent UI elements like the `<Navbar />` so they don't re-render during client navigation.

```tsx
// app/layout.tsx
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-[#07050d] text-slate-100">
            <Navbar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

---

### B. Server Components vs Client Components

Next.js App Router defaults all components to **Server Components**. We selectively opt into **Client Components** when client state or browser APIs are required:

1. **Client Components (`"use client"`):**
   - `app/components/Dashboard.tsx`: Manages interactive states like `searchQuery`, `filterTab`, view switching (Grid vs List), quick file selection, and deleting resumes.
   - `app/upload/page.tsx`: Manages form inputs (`jobTitle`, `jobDescription`), UploadThing client file picker hooks (`useUploadThing`), and loading spinners.
   - `app/results/PrintButton.tsx`: Invokes browser window printing (`window.print()`).

2. **Server Components:**
   - `app/results/page.tsx`: Executes on the server to directly query PostgreSQL via Prisma before sending rendered HTML to the browser.

```tsx
// app/results/page.tsx - Server Component
import { getResumeAnalysis } from "@/lib/data/results";
import PrintButton from "./PrintButton";

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const dataParam = params.resumeId;

  // Direct server-side data fetching without an extra HTTP request!
  const data = await getResumeAnalysis(dataParam);
  const { aiResponse, jobTitle, fileName } = data;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Renders server HTML */}
      <h1 className="text-3xl font-black">{jobTitle}</h1>
      <PrintButton />
    </main>
  );
}
```

---

### C. API Route Handlers (`app/api/*/route.ts`)

Next.js API Route Handlers replace traditional Express routes. They export async HTTP methods (`GET`, `POST`, `DELETE`):

1. **`POST /api/analyze-resume`**: Accepts uploaded file metadata, downloads file buffers, extracts text, invokes Gemini AI, and persists data to PostgreSQL.
2. **`GET /api/my-resumes`**: Returns all resumes belonging to the authenticated Clerk user.
3. **`DELETE /api/my-resumes?id=...`**: Deletes a specific resume record by ID for the authenticated user.

```ts
// app/api/my-resumes/route.ts
export async function DELETE(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get("id");

  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.resume.delete({
    where: { id: resumeId!, userId: user.id },
  });

  return NextResponse.json({ success: true, message: "Resume deleted" });
}
```

---

### D. Middleware Edge Guard (`middleware.ts`)

Next.js `middleware.ts` runs on the edge before any route is handled. We use `clerkMiddleware()` to automatically intercept incoming requests and inject user auth context into request headers.

---

### E. Environment Configuration (`.env`)

Next.js natively loads environment variables from `.env`.
- `GEMINI_API_KEY`: Server-only environment variable used inside API routes.
- `DATABASE_URL`: Server-only PostgreSQL connection string used by Prisma.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public environment variable accessible on both server and client.

---

## 3. End-to-End System Data Flow

```
+------------------+         +------------------+         +--------------------------+
|  User Browser    | ------> |  UploadThing CDN | ------> | Returns Secure File URL  |
+------------------+         +------------------+         +--------------------------+
         |                                                             |
         | Send { fileUrl, jobTitle, jobDesc }                         |
         v                                                             v
+----------------------------------------------------------------------------------+
| Next.js Server API Route: POST /api/analyze-resume                                |
| 1. Authenticate with Clerk (auth())                                              |
| 2. Fetch File Buffer & Extract Raw Text (pdf-parse / mammoth)                    |
| 3. Send Prompt to Gemini AI (Multi-model Fallback: 1.5-flash / 2.0-flash-lite)    |
| 4. Parse & Sanitize JSON (State-machine character escaping)                      |
| 5. Persist User & Analysis Record to PostgreSQL via Prisma                       |
+----------------------------------------------------------------------------------+
         |
         | Return { success: true, resumeId: "uuid" }
         v
+----------------------------------------------------------------------------------+
| Next.js Client: Navigate to /results?resumeId=uuid                               |
| Server Component renders full analysis report                                    |
+----------------------------------------------------------------------------------+
```
