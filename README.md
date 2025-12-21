# Resume Analyzer

A modern, AI-powered resume analysis application built with Next.js, Clerk, Prisma, and PostgreSQL.

## Features

- 🔐 Authentication with Clerk
- 📊 AI-powered resume analysis with comprehensive reports
- 📄 Support for PDF and DOCX resume formats
- 🎯 ATS score calculation (0-100)
- 🔍 Keyword matching analysis
- 📝 Section-by-section analysis (Skills, Summary, Experience)
- 💡 Improvement suggestions
- 💾 PostgreSQL database with Prisma ORM

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or remote)
- OpenAI API key (for AI-powered resume analysis)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your environment variables:

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/resume_analyzer?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Google OAuth (Optional - for Google sign-in)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# OpenAI API (Required for resume analysis)
OPENAI_API_KEY="your-openai-api-key-here"
```

**Note:** Generate a secure `NEXTAUTH_SECRET` using:
```bash
openssl rand -base64 32
```

3. Set up the database:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Sign In**: Click "Sign In" in the navbar or use the "Upload Resume" button to be prompted to sign in.

2. **Upload Resume**: 
   - Click "Upload Resume" on the homepage
   - Fill in the Job Title and Job Description fields
   - Upload your resume (PDF or DOCX format)
   - Click "Analyze Resume"

3. **View Results**: 
   - Review your ATS score (0-100)
   - Check keyword matching analysis
   - Review section-by-section feedback (Skills, Summary, Experience)
   - Read improvement suggestions
   - View overall assessment

