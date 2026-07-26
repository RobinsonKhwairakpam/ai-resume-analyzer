import { getResumeAnalysis } from "@/lib/data/results";
import PrintButton from "./PrintButton";
import Link from "next/link";

interface AnalysisResult {
  sections: {
    skills: {
      found: string[];
      missing: string[];
      analysis: string;
    };
    summary: {
      present: boolean;
      quality: string;
      analysis: string;
      suggestions: string[];
    };
    experience: {
      relevance: string;
      analysis: string;
      keyAchievements: string[];
      suggestions: string[];
    };
  };
  keywordMatching: {
    matchedKeywords: string[];
    missingKeywords: string[];
    matchPercentage: number;
    analysis: string;
  };
  atsScore: {
    score: number;
    breakdown: {
      formatting: number;
      keywords: number;
      relevance: number;
      completeness: number;
    };
    explanation: string;
  };
  positiveFeedback: string[];
  improvements: Array<{
    category: string;
    issue: string;
    suggestion: string;
    priority: string;
  }>;
  overallAssessment: string;
}

interface ResultsPageProps {
  searchParams: Promise<{
    resumeId: string;
  }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const dataParam = params.resumeId;
  let data = null;

  if (dataParam) {
    try {
      data = await getResumeAnalysis(dataParam);
    } catch (error) {
      console.error("Error fetching analysis on server:", error);
    }
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl bg-[#0f0b18] border border-[#1d162e] p-12 space-y-5 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-100">No results found</h1>
          <p className="text-sm text-slate-400">The requested resume analysis could not be located.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 text-sm font-bold rounded-xl bg-violet-800 hover:bg-violet-700 text-white transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const { aiResponse, jobTitle, fileName } = data;
  const analysis = aiResponse as unknown as AnalysisResult;

  const score = analysis?.atsScore?.score || 0;
  const scoreColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 60
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1d162e] pb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-slate-100">
            Resume Analysis Report
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Role: <span className="text-violet-300 font-bold">{jobTitle || "General Resume Analysis"}</span> {fileName ? `• ${fileName}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* ATS Score Card */}
      <div className="rounded-2xl bg-[#0f0b18] border border-[#1d162e] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1d162e] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-950/40 border border-violet-800/30 px-3.5 py-1 text-xs font-bold text-violet-300 mb-2">
              ATS Compatibility Rating
            </div>
            <h2 className="text-xl font-bold text-slate-100">Overall ATS Score</h2>
            <p className="text-sm text-slate-400 max-w-lg mt-1.5 leading-relaxed">
              {analysis?.atsScore?.explanation}
            </p>
          </div>

          <div className="flex items-baseline gap-1.5 bg-[#07050d] border border-[#1d162e] px-6 py-4 rounded-2xl text-center self-start md:self-auto">
            <span className={`text-5xl font-black ${scoreColor}`}>
              {score}
            </span>
            <span className="text-slate-500 font-bold text-lg">/100</span>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#07050d] border border-[#1d162e] rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Formatting</p>
            <p className="text-2xl font-black text-violet-300">
              {analysis?.atsScore?.breakdown?.formatting ?? "-"}%
            </p>
          </div>
          <div className="bg-[#07050d] border border-[#1d162e] rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keywords</p>
            <p className="text-2xl font-black text-violet-300">
              {analysis?.atsScore?.breakdown?.keywords ?? "-"}%
            </p>
          </div>
          <div className="bg-[#07050d] border border-[#1d162e] rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Relevance</p>
            <p className="text-2xl font-black text-violet-300">
              {analysis?.atsScore?.breakdown?.relevance ?? "-"}%
            </p>
          </div>
          <div className="bg-[#07050d] border border-[#1d162e] rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completeness</p>
            <p className="text-2xl font-black text-violet-300">
              {analysis?.atsScore?.breakdown?.completeness ?? "-"}%
            </p>
          </div>
        </div>
      </div>

      {/* Keyword Match Card */}
      {analysis?.keywordMatching && (
        <div className="rounded-2xl bg-[#0f0b18] border border-[#1d162e] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-100">Keyword Matching</h2>
            <div className="text-sm font-bold text-violet-300">
              Match Percentage: {analysis.keywordMatching.matchPercentage}%
            </div>
          </div>

          <div className="w-full bg-[#07050d] border border-[#1d162e] rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-violet-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${analysis.keywordMatching.matchPercentage}%` }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400" />
                Matched Keywords ({analysis.keywordMatching.matchedKeywords?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keywordMatching.matchedKeywords?.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 text-xs sm:text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-400" />
                Missing Keywords ({analysis.keywordMatching.missingKeywords?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keywordMatching.missingKeywords?.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs sm:text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {analysis.keywordMatching.analysis && (
            <p className="text-sm text-slate-300 pt-3 border-t border-[#1d162e] leading-relaxed">
              {analysis.keywordMatching.analysis}
            </p>
          )}
        </div>
      )}

      {/* Detailed Sections */}
      {analysis?.sections && (
        <div className="space-y-6">
          {analysis.sections.skills && (
            <div className="rounded-2xl bg-[#0f0b18] border border-[#1d162e] p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-100">Skills Evaluation</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm font-bold text-violet-300 mb-2">
                    Found Skills ({analysis.sections.skills.found?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.sections.skills.found?.map((s, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-violet-950/40 border border-violet-800/30 text-violet-300 text-xs sm:text-sm font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-300 mb-2">
                    Missing Skills ({analysis.sections.skills.missing?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.sections.skills.missing?.map((s, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-amber-950/30 border border-amber-900/30 text-amber-300 text-xs sm:text-sm font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 pt-2 leading-relaxed">{analysis.sections.skills.analysis}</p>
            </div>
          )}

          {analysis.sections.summary && (
            <div className="rounded-2xl bg-[#0f0b18] border border-[#1d162e] p-6 shadow-xl space-y-3">
              <h2 className="text-lg font-bold text-slate-100">Executive Summary Analysis</h2>
              <p className="text-sm text-slate-300 leading-relaxed">{analysis.sections.summary.analysis}</p>
            </div>
          )}

          {analysis.sections.experience && (
            <div className="rounded-2xl bg-[#0f0b18] border border-[#1d162e] p-6 shadow-xl space-y-3">
              <h2 className="text-lg font-bold text-slate-100">Experience Analysis</h2>
              <p className="text-sm text-slate-300 leading-relaxed">{analysis.sections.experience.analysis}</p>
            </div>
          )}
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        {analysis?.positiveFeedback && analysis.positiveFeedback.length > 0 && (
          <div className="rounded-2xl bg-emerald-950/20 border border-emerald-900/30 p-6 space-y-3 shadow-xl">
            <h2 className="text-base font-bold text-emerald-400">Key Strengths</h2>
            <ul className="space-y-2 text-sm text-slate-200">
              {analysis.positiveFeedback.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis?.improvements && analysis.improvements.length > 0 && (
          <div className="rounded-2xl bg-violet-950/20 border border-violet-900/30 p-6 space-y-3 shadow-xl">
            <h2 className="text-base font-bold text-violet-300">Recommended Enhancements</h2>
            <div className="space-y-3">
              {analysis.improvements.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#07050d] border border-[#1d162e] text-sm space-y-1">
                  <p className="text-slate-100 font-bold">{item.issue}</p>
                  <p className="text-slate-400 text-xs sm:text-sm">{item.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overall Assessment */}
      {analysis?.overallAssessment && (
        <div className="rounded-2xl bg-[#0f0b18] border border-[#1d162e] p-6 shadow-xl space-y-2">
          <h2 className="text-base font-bold text-violet-300">Overall Recruiter Assessment</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{analysis.overallAssessment}</p>
        </div>
      )}
    </main>
  );
}
