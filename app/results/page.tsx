import { getResumeAnalysis } from "@/lib/data/results";
import PrintButton from "./PrintButton";

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

interface AnalysisData {
  success: boolean;
  jobTitle: string;
  jobDescription: string;
  resumeText: string;
  analysis: AnalysisResult;
}

interface ResultsPageProps {
  searchParams: {
    resumeId: string;
  };
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;

  const dataParam = params.resumeId;
  let data = null;

  if (dataParam) {
    try {
      data = await getResumeAnalysis(dataParam);
      console.log(data)
    } catch (error) {
      console.error("Error parsing searchParams data on server:", error);
    }
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-8">No results found</h1>
          <a
            href="/upload" // Use next/link or a standard <a> for navigation
            className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105"
          >
            Go Back to Upload
          </a>
        </div>
      </main>
    );
  }

  const { aiResponse, jobTitle } = data;
  // Assuming aiResponse matches the AnalysisResult structure
  const analysis = aiResponse as unknown as AnalysisResult;

  const scoreColor =
    analysis?.atsScore?.score >= 80
      ? "text-green-400"
      : analysis?.atsScore?.score >= 60
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        {/* <button
          onClick={() => router.push("/upload")}
          className="mb-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Upload
        </button> */}
        <h1 className="text-4xl font-bold text-white mb-2">
          Resume Analysis Results
        </h1>
        <p className="text-gray-400">Job Title: {jobTitle}</p>
      </div>

      {/* ATS Score Card */}
      <div className="mb-8 rounded-xl border border-gray-600 bg-gray-900/50 p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">ATS Score</h2>
          <div className={`text-5xl font-bold ${scoreColor}`}>
            {analysis?.atsScore?.score}
            <span className="text-2xl text-gray-400">/100</span>
          </div>
        </div>
        <p className="text-gray-300 mb-6">{analysis?.atsScore?.explanation}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Formatting</p>
            <p className="text-xl font-semibold text-white">
              {analysis?.atsScore?.breakdown?.formatting}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Keywords</p>
            <p className="text-xl font-semibold text-white">
              {analysis?.atsScore?.breakdown?.keywords}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Relevance</p>
            <p className="text-xl font-semibold text-white">
              {analysis?.atsScore?.breakdown?.relevance}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Completeness</p>
            <p className="text-xl font-semibold text-white">
              {analysis?.atsScore?.breakdown?.completeness}
            </p>
          </div>
        </div>
      </div>

      {/* Keyword Matching */}
      <div className="mb-8 rounded-xl border border-gray-600 bg-gray-900/50 p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-4">
          Keyword Matching
        </h2>
        <div className="mb-4">
          <p className="text-lg font-semibold text-white mb-2">
            Match Percentage: {analysis?.keywordMatching?.matchPercentage}%
          </p>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${analysis?.keywordMatching?.matchPercentage}%`,
              }}
            ></div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-green-400 font-semibold mb-2">
              Matched Keywords ({analysis.keywordMatching.matchedKeywords.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordMatching.matchedKeywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm border border-green-500/30"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-red-400 font-semibold mb-2">
              Missing Keywords ({analysis.keywordMatching.missingKeywords.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordMatching.missingKeywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm border border-red-500/30"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="text-gray-300 mt-4">{analysis.keywordMatching.analysis}</p>
      </div>

      {/* Sections Analysis */}
      <div className="mb-8 space-y-6">
        {/* Skills Section */}
        <div className="rounded-xl border border-gray-600 bg-gray-900/50 p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Skills Analysis</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <h3 className="text-green-400 font-semibold mb-2">
                Found Skills ({analysis.sections.skills.found.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.sections.skills.found.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-yellow-400 font-semibold mb-2">
                Missing Skills ({analysis.sections.skills.missing.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.sections.skills.missing.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm border border-yellow-500/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-gray-300">{analysis.sections.skills.analysis}</p>
        </div>

        {/* Summary Section */}
        <div className="rounded-xl border border-gray-600 bg-gray-900/50 p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Summary Analysis</h2>
          <div className="mb-4">
            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm mr-2">
              Present: {analysis.sections.summary.present ? "Yes" : "No"}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm">
              Quality: {analysis.sections.summary.quality}
            </span>
          </div>
          <p className="text-gray-300 mb-4">{analysis.sections.summary.analysis}</p>
          {analysis.sections.summary.suggestions.length > 0 && (
            <div>
              <h3 className="text-purple-400 font-semibold mb-2">Suggestions:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {analysis.sections.summary.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Experience Section */}
        <div className="rounded-xl border border-gray-600 bg-gray-900/50 p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">
            Experience Analysis
          </h2>
          <div className="mb-4">
            <span className="px-3 py-1 rounded-full bg-gray-600 text-gray-300 text-sm">
              Relevance: {analysis.sections.experience.relevance}
            </span>
          </div>
          <p className="text-gray-300 mb-4">
            {analysis.sections.experience.analysis}
          </p>
          {analysis.sections.experience.keyAchievements.length > 0 && (
            <div className="mb-4">
              <h3 className="text-green-400 font-semibold mb-2">
                Key Achievements:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {analysis.sections.experience.keyAchievements.map(
                  (achievement, idx) => (
                    <li key={idx}>{achievement}</li>
                  )
                )}
              </ul>
            </div>
          )}
          {analysis.sections.experience.suggestions.length > 0 && (
            <div>
              <h3 className="text-purple-400 font-semibold mb-2">Suggestions:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {analysis.sections.experience.suggestions.map(
                  (suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Positive Feedback */}
      {analysis.positiveFeedback.length > 0 && (
        <div className="mb-8 rounded-xl border border-green-800/50 bg-green-900/20 p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-green-400 mb-4">
            Positive Feedback
          </h2>
          <ul className="space-y-2">
            {analysis.positiveFeedback.map((feedback, idx) => (
              <li key={idx} className="flex items-start gap-2 text-gray-300">
                <svg
                  className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {feedback}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {analysis.improvements.length > 0 && (
        <div className="mb-8 rounded-xl border border-yellow-800/50 bg-yellow-900/20 p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            Recommended Improvements
          </h2>
          <div className="space-y-4">
            {analysis.improvements.map((improvement, idx) => (
              <div
                key={idx}
                className="border-l-4 border-yellow-500 pl-4 py-2 bg-gray-900/30 rounded-r"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-800 text-gray-300">
                    {improvement.category}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${improvement.priority === "high"
                      ? "bg-red-500/20 text-red-400"
                      : improvement.priority === "medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-blue-500/20 text-blue-400"
                      }`}
                  >
                    {improvement.priority} priority
                  </span>
                </div>
                <p className="text-gray-300 mb-1">
                  <span className="font-semibold">Issue:</span> {improvement.issue}
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold">Suggestion:</span>{" "}
                  {improvement.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Assessment */}
      <div className="rounded-xl border border-purple-800/50 bg-purple-900/20 p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">
          Overall Assessment
        </h2>
        <p className="text-gray-300 leading-relaxed">
          {analysis.overallAssessment}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        {/* <button
          onClick={() => router.push("/upload")}
          className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105"
        >
          Analyze Another Resume
        </button> */}
        <PrintButton />
      </div>
    </main>
  );
}
