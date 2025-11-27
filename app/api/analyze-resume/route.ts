// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const runtime = "nodejs"; // ✅ Ensure Node runtime (not edge)
export const maxDuration = 60; // ✅ Prevent timeout on large resumes

export async function POST(request: NextRequest) {
  try {
    console.log("POST")
    // Get authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await currentUser();
    if (!user?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get or create user in database
    const dbUser = await prisma.user.upsert({
      where: { clerkUserId },
      update: {},
      create: {
        clerkUserId,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    const body = await request.json();
    const { fileUrl, fileName, fileType, jobTitle, jobDescription } = body;

    if (!fileUrl || !fileName || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Download file from URL
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to download file from URL" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    const extension = fileName.split(".").pop()?.toLowerCase() || fileType?.toLowerCase() || "";
    const typedArray = new Uint8Array(fileBuffer);

    let resumeText = "";

    if (extension === "pdf") {
      const parser = new PDFParse(typedArray);
      resumeText = (await parser.getText()).text;
    } else if (extension === "docx") {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      resumeText = result.value;
    } else {
      return NextResponse.json(
        {
          error: "Unsupported file type. Please upload a PDF or DOCX resume.",
        },
        { status: 400 }
      );
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from resume" },
        { status: 400 }
      );
    }

    // ✅ Truncate long text to avoid OpenAI token limit
    const truncatedResume =
      resumeText.length > 10000
        ? resumeText.slice(0, 10000) + "..."
        : resumeText;

    const analysisPrompt = `
You are an expert resume analyzer and career advisor. Analyze the following resume against the provided job description and return a comprehensive analysis in JSON format.

RESUME TEXT:
${truncatedResume}

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

Return a JSON object ONLY, with this structure:
{
  "sections": {
    "skills": {
      "found": ["..."],
      "missing": ["..."],
      "analysis": "..."
    },
    "summary": {
      "present": true,
      "quality": "good",
      "analysis": "...",
      "suggestions": ["..."]
    },
    "experience": {
      "relevance": "high",
      "analysis": "...",
      "keyAchievements": ["..."],
      "suggestions": ["..."]
    }
  },
  "keywordMatching": {
    "matchedKeywords": ["..."],
    "missingKeywords": ["..."],
    "matchPercentage": 0,
    "analysis": "..."
  },
  "atsScore": {
    "score": 0,
    "breakdown": {
      "formatting": 0,
      "keywords": 0,
      "relevance": 0,
      "completeness": 0
    },
    "explanation": "..."
  },
  "positiveFeedback": ["..."],
  "improvements": [
    {
      "category": "...",
      "issue": "...",
      "suggestion": "...",
      "priority": "medium"
    }
  ],
  "overallAssessment": "..."
}
`;

    // ✅ Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // ✅ Generate content
    const result = await model.generateContent(analysisPrompt);

    // ✅ Extract and sanitize response text
    let responseText = result.response.text().trim();

    // Remove possible Markdown code fences (```json ... ```)
    responseText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    // ✅ Attempt to parse JSON safely
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(responseText);
    } catch (err) {
      console.error("⚠️ Gemini returned invalid JSON:", responseText);
      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned invalid JSON format.",
          rawResponse: responseText,
        },
        { status: 500 }
      );
    }

    // Extract ATS score from analysis if available
    const atsScore = parsedAnalysis?.atsScore?.score || null;

    // Save to database
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

    // ✅ Success response
    return NextResponse.json({
      success: true,
      resumeId: savedResume.id,
      jobTitle,
      jobDescription,
      resumePreview: truncatedResume.slice(0, 300) + "...",
      analysis: parsedAnalysis,
    });
  } catch (err: any) {
    console.error("❌ Error analyzing resume:", err);
    return NextResponse.json(
      {
        error: "Failed to analyze resume",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
