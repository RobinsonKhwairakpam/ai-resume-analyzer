"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { UploadDropzone } from "@/lib/uploadthing";
import { useUploadThing } from "@/lib/uploadthing"; // <-- IMPORTANT
import SignInModal from "@/app/components/SignInModal";

type FileUploadResponse = {
  name: string;
  size: number;
  key: string;
  url: string;
};

export default function UploadPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Store file BEFORE upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Use uploadthing hook
  const { startUpload } = useUploadThing("resumeUploader");

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setShowSignInModal(true);
    }
  }, [isLoaded, isSignedIn]);

  const handleAnalyze = async () => {
    if (!jobTitle.trim() || !jobDescription.trim() || !selectedFile) {
      setError("Please fill in all fields and choose a resume file.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      // 🔥 Upload file ONLY when user clicks Analyze
      const uploadRes = await startUpload([selectedFile]);

      if (!uploadRes || uploadRes.length === 0) {
        throw new Error("Upload failed. Try again.");
      }

      const uploaded = uploadRes[0];

      const reqBody = JSON.stringify({
        fileUrl: uploaded.url,
        fileName: uploaded.name,
        fileType: uploaded.name.split(".").pop(),
        jobTitle,
        jobDescription,
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

      router.push(`/my-resumes`);
    } catch (err: any) {
      setError(err.message || "Error analyzing resume");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
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
            onClose={() => {
              setShowSignInModal(false);
              router.push("/");
            }}
            redirectUrl="/upload"
          />
        )}
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Upload Your Resume
            </h1>
            <p className="text-gray-400 mb-6">
              Please sign in to upload and analyze your resume
            </p>
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
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Upload Your Resume
        </h1>
        <p className="text-gray-400">
          Upload your resume and provide job details for AI-powered analysis
        </p>
      </div>

      <div className="space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Software Engineer"
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-white"
          />
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows={8}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-white resize-none"
          />
        </div>

        {/* File Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Choose Resume File
          </label>

          {!selectedFile ? (
            <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-4">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]); // Store locally
                    setError("");
                  }
                }}
                className="text-white"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-lg font-semibold text-white disabled:opacity-50"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
        </button>
      </div>
    </main>
  );
}
