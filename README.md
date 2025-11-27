# Resume Analyzer

A modern, AI-powered resume analysis application built with Next.js, NextAuth, Prisma, and PostgreSQL.

## Features

- 🔐 Authentication with Clerk
- 📊 AI-powered resume analysis with comprehensive reports
- 📄 Support for PDF and DOCX resume formats
- 🎯 ATS score calculation (0-100)
- 🔍 Keyword matching analysis
- 📝 Section-by-section analysis (Skills, Summary, Experience)
- 💡 Actionable improvement suggestions
- 🎨 Modern dark theme UI with gradients and shadows
- 💾 PostgreSQL database with Prisma ORM
- 📱 Responsive design

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

## Project Structure

```
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/     # NextAuth API routes
│   ├── components/
│   │   ├── Navbar.tsx              # Navigation bar component
│   │   └── SignInModal.tsx         # Sign-in modal component
│   ├── layout.tsx                  # Root layout with Navbar
│   ├── page.tsx                    # Landing page
│   └── providers.tsx               # NextAuth SessionProvider
├── lib/
│   ├── auth.ts                     # NextAuth configuration
│   └── prisma.ts                   # Prisma client instance
├── prisma/
│   └── schema.prisma               # Database schema
└── types/
    └── next-auth.d.ts              # NextAuth TypeScript types
```

## Authentication

The app supports two authentication methods:

1. **Email/Credentials**: Simple email-based authentication (demo mode - creates user if doesn't exist)
2. **Google OAuth**: Sign in with Google account

To enable Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env` file

## Database

The application uses PostgreSQL with Prisma ORM. The schema includes:

- `User` - User accounts
- `Account` - OAuth account connections
- `Session` - User sessions
- `VerificationToken` - Email verification tokens

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
