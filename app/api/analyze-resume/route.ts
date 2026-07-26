import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const runtime = "nodejs";
export const maxDuration = 60;

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

function extractAndParseJSON(rawText: string) {
  let cleaned = rawText.trim();

  cleaned = cleaned
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

// Enforce exact Gemini Schema typed with ResponseSchema
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
    keywordMatching: {
      type: SchemaType.OBJECT,
      properties: {
        matchedKeywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        missingKeywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        matchPercentage: { type: SchemaType.NUMBER },
        analysis: { type: SchemaType.STRING },
      },
      required: ["matchedKeywords", "missingKeywords", "matchPercentage", "analysis"],
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
  required: [
    "sections",
    "keywordMatching",
    "atsScore",
    "positiveFeedback",
    "improvements",
    "overallAssessment",
  ],
};

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
`;

    // Candidate models list
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
          break;
        }
      } catch (err: any) {
        console.warn(`⚠️ Model '${modelName}' failed:`, err?.message || err);
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