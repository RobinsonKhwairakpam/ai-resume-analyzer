# Key Code Snippets & Functional Modules

This document collects the most important production-ready code snippets powering the **AI Resume Analyzer**.

---

## 1. Authentication & Route Protection (`Clerk`)

### Middleware Route Protection (`middleware.ts`)
```ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

### Server-Side Auth Check (`app/api/analyze-resume/route.ts`)
```ts
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  // Get authenticated user ID
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!user?.emailAddresses[0]?.emailAddress) {
    return NextResponse.json({ error: "User email not found" }, { status: 400 });
  }
  
  // Proceed with processing...
}
```

---

## 2. Gemini AI Schema Definition & Multi-Model Fallback

### Gemini JSON Schema Definition (`ResponseSchema`)
```ts
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";

const responseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sections: {
      type: SchemaType.OBJECT,
      properties: {
        skills: {
          type: SchemaType.OBJECT,
          properties: {
            found: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            missing: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            analysis: { type: SchemaType.STRING },
          },
          required: ["found", "missing", "analysis"],
        },
        summary: {
          type: SchemaType.OBJECT,
          properties: {
            present: { type: SchemaType.BOOLEAN },
            quality: { type: SchemaType.STRING },
            analysis: { type: SchemaType.STRING },
            suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
          required: ["present", "quality", "analysis", "suggestions"],
        },
        experience: {
          type: SchemaType.OBJECT,
          properties: {
            relevance: { type: SchemaType.STRING },
            analysis: { type: SchemaType.STRING },
            keyAchievements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
          required: ["relevance", "analysis", "keyAchievements", "suggestions"],
        },
      },
      required: ["skills", "summary", "experience"],
    },
    atsScore: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.NUMBER },
        breakdown: {
          type: SchemaType.OBJECT,
          properties: {
            formatting: { type: SchemaType.NUMBER },
            keywords: { type: SchemaType.NUMBER },
            relevance: { type: SchemaType.NUMBER },
            completeness: { type: SchemaType.NUMBER },
          },
          required: ["formatting", "keywords", "relevance", "completeness"],
        },
        explanation: { type: SchemaType.STRING },
      },
      required: ["score", "breakdown", "explanation"],
    },
    positiveFeedback: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    improvements: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          issue: { type: SchemaType.STRING },
          suggestion: { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING },
        },
        required: ["category", "issue", "suggestion", "priority"],
      },
    },
    overallAssessment: { type: SchemaType.STRING },
  },
  required: ["sections", "atsScore", "positiveFeedback", "improvements", "overallAssessment"],
};
```

### Multi-Model Execution Loop
```ts
const candidateModels = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
];

let responseText = "";
let lastError: any = null;

for (const modelName of candidateModels) {
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    const result = await model.generateContent(analysisPrompt);
    const text = result.response.text();
    if (text && text.trim()) {
      responseText = text.trim();
      break; // Stop loop as soon as a model succeeds
    }
  } catch (err: any) {
    console.warn(`⚠️ Model '${modelName}' failed:`, err?.message || err);
    lastError = err;
  }
}
```

---

## 3. Resilient JSON Parsing & Character Escaping Engine

```ts
// Character state machine that escapes raw unescaped newlines/tabs inside double-quoted JSON strings
function sanitizeAndEscapeJSONStrings(jsonStr: string): string {
  let inString = false;
  let isEscaped = false;
  let result = "";

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (inString) {
      if (char === '"' && !isEscaped) {
        inString = false;
        result += char;
      } else if (char === '\\' && !isEscaped) {
        isEscaped = true;
        result += char;
      } else {
        if (isEscaped) {
          isEscaped = false;
        }
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else {
          result += char;
        }
      }
    } else {
      if (char === '"') {
        inString = true;
      }
      result += char;
    }
  }

  return result;
}

// Multi-pass extractor attempting direct parse, trailing comma fixes, and state-machine escaping
function extractAndParseJSON(rawText: string) {
  let cleaned = rawText.trim()
    .replace(/^```(?:json)?\s*/gi, "")
    .replace(/```$/gi, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) {
    throw new Error("No opening JSON brace found in response");
  }

  cleaned = cleaned.substring(firstBrace);

  let lastIndex = cleaned.lastIndexOf("}");
  while (lastIndex > 0) {
    const candidate = cleaned.slice(0, lastIndex + 1);

    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const stringEscaped = sanitizeAndEscapeJSONStrings(candidate);
        const trailingCommaFixed = stringEscaped.replace(/,\s*([\}\]])/g, "$1");
        return JSON.parse(trailingCommaFixed);
      } catch {
        lastIndex = cleaned.lastIndexOf("}", lastIndex - 1);
      }
    }
  }

  throw new Error("Could not parse valid JSON from model response");
}
```

---

## 4. Server-Side Document Parsing (`pdf-parse` & `mammoth`)

```ts
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// Download file buffer from UploadThing CDN
const fileResponse = await fetch(fileUrl);
const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
const extension = fileName.split(".").pop()?.toLowerCase() || "";
const typedArray = new Uint8Array(fileBuffer);

let resumeText = "";

if (extension === "pdf") {
  const parser = new PDFParse(typedArray);
  resumeText = (await parser.getText()).text;
} else if (extension === "docx") {
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  resumeText = result.value;
}
```

---

## 5. Database Schema & Prisma Data Access (`prisma`)

### Schema (`prisma/schema.prisma`)
```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id          String   @id @default(uuid())
  clerkUserId String   @unique
  email       String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  resumes     Resume[]
}

model Resume {
  id             String   @id @default(uuid())
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId         String

  fileName       String
  fileUrl        String?
  fileType       String?

  extractedText  String
  jobTitle       String
  jobDescription String

  aiResponse     Json
  atsScore       Float?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### Saving Resume Analysis to Database
```ts
const savedResume = await prisma.resume.create({
  data: {
    userId: dbUser.id,
    fileName,
    fileUrl,
    fileType: extension,
    extractedText: resumeText,
    jobTitle,
    jobDescription,
    aiResponse: parsedAnalysis,
    atsScore: atsScore ? parseFloat(atsScore.toString()) : null,
  },
});
```

### Fetching User Analysis on Server Component (`lib/data/results.ts`)
```ts
import prisma from "@/lib/prisma";

export async function getResumeAnalysis(resumeId: string) {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    throw new Error("Resume analysis not found");
  }

  return {
    success: true,
    jobTitle: resume.jobTitle,
    jobDescription: resume.jobDescription,
    fileName: resume.fileName,
    fileUrl: resume.fileUrl,
    aiResponse: resume.aiResponse,
    atsScore: resume.atsScore,
    createdAt: resume.createdAt,
  };
}
```
