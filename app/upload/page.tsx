"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useUploadThing } from "@/lib/uploadthing";
import SignInModal from "@/app/components/SignInModal";

export default function UploadPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [showSignInModal, setShowSignInModal] = useState(false);

  const { startUpload } = useUploadThing("resumeUploader");

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setShowSignInModal(true);
    }
  }, [isLoaded, isSignedIn]);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a resume file to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const uploadRes = await startUpload([selectedFile]);

      if (!uploadRes || uploadRes.length === 0) {
        throw new Error("Upload failed. Please try again.");
      }

      const uploaded = uploadRes[0];

      const reqBody = JSON.stringify({
        fileUrl: uploaded.url,
        fileName: uploaded.name,
        fileType: uploaded.name.split(".").pop(),
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
      });

      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: reqBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze resume");
      }

      const resData = await response.json();
      router.push(`/results?resumeId=${resData.resumeId}`);
    } catch (err: any) {
      setError(err.message || "Error analyzing resume");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="size-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="text-sm text-indigo-300 font-medium">Loading upload form...</p>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        {showSignInModal && (
          <SignInModal
            onClose={() => {
              setShowSignInModal(false);
              router.push("/");
            }}
            redirectUrl="/upload"
          />
        )}
        <main className="mx-auto max-w-3xl px-4 py-16">
          <div className="text-center rounded-2xl bg-[#0f0b1a] border border-[#1e1736] p-12 shadow-2xl space-y-5">
            <h1 className="text-3xl font-bold text-slate-100">
              Upload Your Resume
            </h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Please sign in to upload and analyze your resume.
            </p>
            <button
              onClick={() => setShowSignInModal(true)}
              className="px-8 py-3 rounded-xl bg-violet-800 hover:bg-violet-700 text-white font-bold text-sm shadow-md cursor-pointer transition-all"
            >
              Sign In to Continue
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-100 mb-2">
          Analyze Resume
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Select your resume file. Optionally specify target job title & description for contextual analysis.
        </p>
      </div>

      <div className="rounded-2xl bg-[#0f0b1a] border border-[#1e1736] p-6 sm:p-10 shadow-xl space-y-7">
        {/* File Picker - Primary Action */}
        <div className="space-y-2.5">
          <label className="block text-sm font-bold text-slate-200 uppercase tracking-wider">
            Resume File <span className="text-violet-400 font-bold">* Required</span>
          </label>

          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-[#231a3e] bg-[#090712] hover:border-violet-600/50 hover:bg-[#0d0918] cursor-pointer transition-all group">
              <div className="flex flex-col items-center justify-center space-y-2 text-center px-4">
                <div className="size-12 rounded-xl bg-violet-950/40 border border-violet-800/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-base font-bold text-slate-200">
                  <span className="text-violet-400">Click to select file</span> or drag & drop here
                </p>
                <p className="text-xs text-slate-400 font-medium">PDF, DOC, or DOCX formats accepted</p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setError("");
                  }
                }}
                className="hidden"
              />
            </label>
          ) : (
            <div className="rounded-xl border border-[#231a3e] bg-[#090712] p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-11 rounded-xl bg-violet-950/60 border border-violet-800/40 flex items-center justify-center text-violet-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-100 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs font-semibold text-slate-400 hover:text-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-950/20 transition-colors"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Divider / Optional Context Header */}
        <div className="pt-3 border-t border-[#1e1736] space-y-1">
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
            Target Job Context <span className="text-slate-500 font-medium lowercase">(optional)</span>
          </h2>
          <p className="text-xs text-slate-400">
            If left blank, a comprehensive general resume analysis will be performed.
          </p>
        </div>

        {/* Optional Job Title */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            Target Job Title <span className="text-slate-500 text-xs font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="w-full rounded-xl border border-[#1e1736] bg-[#090712] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/70 transition-colors"
          />
        </div>

        {/* Optional Job Description */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            Job Description <span className="text-slate-500 text-xs font-normal">(Optional)</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job posting text here for keyword matching..."
            rows={6}
            className="w-full rounded-xl border border-[#1e1736] bg-[#090712] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/70 resize-none transition-colors"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-rose-950/30 border border-rose-900/40 p-4 text-sm text-rose-300 font-medium">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-4 text-base font-bold rounded-xl bg-violet-800 hover:bg-violet-700 text-white disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <div className="size-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span>Analyzing Resume...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Start Analysis</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
}
