import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const runtime = "nodejs";
export const maxDuration = 60;

function extractAndParseJSON(rawText: string) {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (firstErr) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const substring = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(substring);
    }
    throw firstErr;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const dbUser = await prisma.user.upsert({
      where: { clerkUserId },
      update: {},
      create: {
        clerkUserId,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    const body = await request.json();
    const { fileUrl, fileName, fileType, jobTitle: rawJobTitle, jobDescription: rawJobDesc } = body;

    if (!fileUrl || !fileName) {
      return NextResponse.json(
        { error: "Missing required resume file" },
        { status: 400 }
      );
    }

    const jobTitle = rawJobTitle && rawJobTitle.trim() ? rawJobTitle.trim() : "General Resume Analysis";
    const isGeneralAnalysis = !rawJobDesc || !rawJobDesc.trim();
    const jobDescription = isGeneralAnalysis
      ? "General resume assessment without a targeted job description."
      : rawJobDesc.trim();

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
        { error: "Unsupported file type. Please upload a PDF or DOCX resume." },
        { status: 400 }
      );
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from resume" },
        { status: 400 }
      );
    }

    const truncatedResume =
      resumeText.length > 10000
        ? resumeText.slice(0, 10000) + "..."
        : resumeText;

    const contextInstruction = isGeneralAnalysis
      ? "Note: The user did NOT provide a specific target job description. Evaluate the resume for general professional quality, overall ATS friendliness, clarity, formatting, bullet point impact metrics, and key technical/professional skills."
      : `JOB TITLE: ${jobTitle}\nJOB DESCRIPTION:\n${jobDescription}`;

    const analysisPrompt = `
You are an expert resume analyzer and executive recruiter. Analyze the following resume. ${contextInstruction}

RESUME TEXT:
${truncatedResume}

Respond ONLY with a valid, raw JSON object (no markdown, no explanations outside JSON) adhering to this schema:
{
  "sections": {
    "skills": {
      "found": ["Skill 1", "Skill 2"],
      "missing": ["Missing Skill 1"],
      "analysis": "Analysis text..."
    },
    "summary": {
      "present": true,
      "quality": "good",
      "analysis": "Summary feedback...",
      "suggestions": ["Suggestion 1"]
    },
    "experience": {
      "relevance": "high",
      "analysis": "Experience feedback...",
      "keyAchievements": ["Achievement 1"],
      "suggestions": ["Suggestion 1"]
    }
  },
  "keywordMatching": {
    "matchedKeywords": ["Keyword 1"],
    "missingKeywords": ["Keyword 2"],
    "matchPercentage": 80,
    "analysis": "Keyword analysis..."
  },
  "atsScore": {
    "score": 85,
    "breakdown": {
      "formatting": 90,
      "keywords": 80,
      "relevance": 85,
      "completeness": 85
    },
    "explanation": "ATS score explanation..."
  },
  "positiveFeedback": ["Feedback 1", "Feedback 2"],
  "improvements": [
    {
      "category": "Formatting",
      "issue": "Issue description",
      "suggestion": "How to improve",
      "priority": "medium"
    }
  ],
  "overallAssessment": "Overall recruiter assessment..."
}
`;

    // Only valid, official Gemini API model identifiers
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
          generationConfig: { responseMimeType: "application/json" },
        });
        const result = await model.generateContent(analysisPrompt);
        const text = result.response.text();
        if (text && text.trim()) {
          responseText = text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`⚠️ Model '${modelName}' call failed:`, err?.message || err);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error("Unable to connect to AI models. Please check your API key.");
    }

    let parsedAnalysis;
    try {
      parsedAnalysis = extractAndParseJSON(responseText);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON response:", responseText);
      return NextResponse.json(
        {
          success: false,
          error: "AI service produced unparseable response format. Please try again.",
        },
        { status: 500 }
      );
    }

    const atsScore = parsedAnalysis?.atsScore?.score || null;

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

    return NextResponse.json({
      success: true,
      resumeId: savedResume.id,
      jobTitle,
      jobDescription,
      analysis: parsedAnalysis,
    });
  } catch (err: any) {
    console.error("❌ Error analyzing resume:", err);
    return NextResponse.json(
      {
        error: err?.message || "Failed to analyze resume",
        details: err?.statusText || "Gemini API request error",
      },
      { status: 500 }
    );
  }
}
