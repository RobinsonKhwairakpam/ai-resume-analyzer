"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import SignInModal from "@/app/components/SignInModal";

interface Resume {
  id: string;
  fileName: string;
  fileUrl: string | null;
  fileType: string | null;
  jobTitle: string;
  jobDescription: string;
  aiResponse: any;
  atsScore: number | null;
  createdAt: string;
}

export default function MyResumesPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchResumes();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
      setError("Please sign in to view your resumes");
    }
  }, [isLoaded, isSignedIn]);

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/my-resumes");
      if (!response.ok) {
        throw new Error("Failed to fetch resumes");
      }
      const data = await response.json();
      setResumes(data.resumes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        {showSignInModal && (
          <SignInModal
            onClose={() => setShowSignInModal(false)}
            redirectUrl="/my-resumes"
          />
        )}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">My Resumes</h1>
            <p className="text-gray-400 mb-6">{error || "Please sign in to view your resumes"}</p>
            <button
              onClick={() => setShowSignInModal(true)}
              className="inline-block rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-white font-semibold hover:scale-105 transition-transform"
            >
              Sign In to Continue
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Resumes</h1>
        <p className="text-gray-400">
          View all your uploaded resumes and their analysis results
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {resumes.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-gray-700 bg-gray-800/30">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-400 mb-4">No resumes uploaded yet</p>
          <Link
            href="/upload"
            className="inline-block rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-white font-semibold hover:scale-105 transition-transform"
          >
            Upload Your First Resume
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {resume.jobTitle}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">{resume.fileName}</p>
                  {resume.atsScore !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        ATS Score:
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          resume.atsScore >= 80
                            ? "text-green-400"
                            : resume.atsScore >= 60
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {resume.atsScore.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
                {resume.fileUrl && (
                  <a
                    href={resume.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                    title="View Resume"
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Job Description Preview:</p>
                <p className="text-sm text-gray-300 line-clamp-3">
                  {resume.jobDescription.slice(0, 150)}
                  {resume.jobDescription.length > 150 ? "..." : ""}
                </p>
              </div>

              {resume.aiResponse && (
                <div className="space-y-2 mb-4">
                  {resume.aiResponse.positiveFeedback &&
                    resume.aiResponse.positiveFeedback.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Strengths:</p>
                        <ul className="text-xs text-green-400 space-y-1">
                          {resume.aiResponse.positiveFeedback
                            .slice(0, 2)
                            .map((feedback: string, idx: number) => (
                              <li key={idx}>• {feedback}</li>
                            ))}
                        </ul>
                      </div>
                    )}

                  {resume.aiResponse.improvements &&
                    resume.aiResponse.improvements.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Improvements:</p>
                        <ul className="text-xs text-yellow-400 space-y-1">
                          {resume.aiResponse.improvements
                            .slice(0, 2)
                            .map((improvement: any, idx: number) => (
                              <li key={idx}>
                                • {improvement.suggestion || improvement.issue}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
                <span>
                  {new Date(resume.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/results?resumeId=${resume.id}`}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  View Full Analysis →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

