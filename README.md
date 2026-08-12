# 📄 AI Resume Analyzer

A modern, full-stack, AI-powered resume analysis and ATS optimization platform built with Next.js 16, Google Gemini AI, Clerk, UploadThing, Prisma, and PostgreSQL.

---

## ✨ Main Features

* **Dashboard:** A dual-pane console presenting live resume analytics (Total Resumes, Avg ATS Score, High Match count), quick search/filtering, and an embedded Quick Scanner.
* **Context-Aware AI Resume Audit:** Evaluates PDF and DOCX resumes against a targeted job description or performs an executive quality assessment when job details are omitted.
* **ATS Scoring Engine:** Calculates an overall 0–100% ATS score with detailed breakdown ratings for formatting, keyword density, role relevance, and profile completeness.
* **Keyword & Skills Matching:** Identifies matched versus missing technical skills and industry keywords to optimize resumes for automated recruitment filters.
* **Prioritized Improvement Feedback:** Delivers actionable, categorized recommendations for formatting, impact metrics, grammar, and executive summary enhancement.
* **Multi-Model AI Resilience:** Features automatic failover across candidate Gemini models to handle API rate limits and free-tier quota bottlenecks with zero downtime.
* **Secure Cloud Storage & Management:** Uploads documents via UploadThing CDN and persists structured JSON reports to a PostgreSQL database.
* **Report Export & Printing:** Provides one-click native browser printing for offline recruiter reviews and application tracking.

---

## 🛠️ Technologies Used

* **Next.js 16 (App Router):** Full-stack React framework providing hybrid Server & Client Components, file-system routing, and server-side API Route Handlers.
* **React 19 & TypeScript:** Modern UI library and static type system ensuring reliable, component-driven development and type-safe data flows.
* **Google Gemini AI (`@google/generative-ai`):** Advanced generative AI SDK utilized with structured JSON schemas (`ResponseSchema`) for AI-powered resume evaluation.
* **Clerk Authentication (`@clerk/nextjs`):** Secure authentication platform providing edge middleware protection, user session management, and custom sign-in modals.
* **Prisma ORM & PostgreSQL:** Next-generation ORM and relational database engine managing relational schemas, lazy user upserts, and JSON analysis storage.
* **UploadThing:** Developer-first file upload infrastructure for securely processing and hosting raw resume document files on a CDN.
* **Document Parsers (`pdf-parse` & `mammoth`):** Server-side Node.js text extraction engines for extracting plain text from PDF and DOCX documents.
* **Tailwind CSS v4:** Utility-first CSS framework configured with a custom, sleek dark and soft-violet glassmorphism theme.

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** (v18.0.0 or higher)
* **PostgreSQL** database instance (local or hosted via Supabase, Neon, Railway, etc.)
* **Clerk** account for publishable & secret keys
* **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))
* **UploadThing** account for app ID & secret key

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/RobinsonKhwairakpam/ai-resume-analyzer.git
cd resume-analyzer
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/resume_analyzer?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# UploadThing Storage
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"

# Google Gemini AI
GEMINI_API_KEY="AIzaSy..."
```

### 3. Database Initialization

```bash
# Generate Prisma Client
npx prisma generate

# Push database schema to PostgreSQL
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

