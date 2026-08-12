"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
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

export default function Dashboard() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "high" | "recent">("all");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick Analyze Widget State
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickJobTitle, setQuickJobTitle] = useState("");
  const [quickJobDesc, setQuickJobDesc] = useState("");
  const [isQuickAnalyzing, setIsQuickAnalyzing] = useState(false);
  const [quickError, setQuickError] = useState("");

  const { startUpload } = useUploadThing("resumeUploader");

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchResumes();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const fetchResumes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/my-resumes");
      if (!response.ok) throw new Error("Failed to fetch resumes");
      const data = await response.json();
      setResumes(data.resumes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resume from your workspace?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/my-resumes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete resume");
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Error deleting resume");
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickAnalyze = async () => {
    if (!quickFile) {
      setQuickError("Please select a resume file first.");
      return;
    }
    if (!isSignedIn) {
      setShowSignInModal(true);
      return;
    }

    setIsQuickAnalyzing(true);
    setQuickError("");

    try {
      const uploadRes = await startUpload([quickFile]);
      if (!uploadRes || uploadRes.length === 0) {
        throw new Error("File upload failed. Please try again.");
      }
      const uploaded = uploadRes[0];

      const reqBody = JSON.stringify({
        fileUrl: uploaded.url,
        fileName: uploaded.name,
        fileType: uploaded.name.split(".").pop(),
        jobTitle: quickJobTitle.trim(),
        jobDescription: quickJobDesc.trim(),
      });

      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: reqBody,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze resume");
      }

      const resData = await response.json();
      router.push(`/results?resumeId=${resData.resumeId}`);
    } catch (err: any) {
      setQuickError(err.message || "Error analyzing resume");
    } finally {
      setIsQuickAnalyzing(false);
    }
  };

  const userName = user
    ? user.firstName
      ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
      : user.primaryEmailAddress?.emailAddress.split("@")[0] || "User"
    : "Guest";

  // KPIs
  const totalResumes = resumes.length;
  const scoredResumes = resumes.filter((r) => r.atsScore !== null);
  const avgScore = scoredResumes.length
    ? Math.round(
      scoredResumes.reduce((acc, curr) => acc + (curr.atsScore || 0), 0) /
      scoredResumes.length
    )
    : 0;
  const highMatchCount = resumes.filter((r) => (r.atsScore || 0) >= 80).length;

  // Filter Logic
  const filteredResumes = resumes.filter((r) => {
    const matchesSearch =
      r.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "high") return (r.atsScore || 0) >= 80;
    if (filterTab === "recent") {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(r.createdAt).getTime() > oneWeekAgo;
    }
    return true;
  });

  // Guest Landing View
  if (isLoaded && !isSignedIn) {
    return (
      <>
        {showSignInModal && (
          <SignInModal onClose={() => setShowSignInModal(false)} redirectUrl="/" />
        )}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
          {/* Guest Hero Box */}
          <div className="mt-16 relative overflow-hidden rounded-3xl bg-[#0f0b18] border border-[#1d162e] p-8 sm:p-14 text-center space-y-6 shadow-2xl">
            {/* <div className="inline-flex items-center gap-2 rounded-full bg-violet-950/40 border border-violet-800/30 px-4 py-1.5 text-sm font-semibold text-violet-300">
              <span className="size-2 rounded-full bg-violet-400" />
              AI Resume Command Center
            </div> */}

            <div className="space-y-4 max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
                Optimize Your Resume for <span className="text-violet-300">Dream Roles</span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                Get instant AI-powered feedback on ATS formatting, keyword density, and key impact metrics. Upload with or without a target job description.
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowSignInModal(true)}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-bold rounded-xl bg-violet-800 hover:bg-violet-700 text-white transition-all shadow-md cursor-pointer"
              >
                Sign In to View Dashboard
              </button>
              <Link
                href="/upload"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-bold rounded-xl bg-[#171126] hover:bg-[#201835] text-slate-200 border border-[#261c3b] transition-all"
              >
                Analyze a Resume
              </Link>
            </div>
          </div>

          {/* Quick Feature Grid */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0f0b18] border border-[#1d162e] rounded-2xl p-6 space-y-3">
              <div className="size-10 rounded-xl bg-violet-950/50 border border-violet-800/30 flex items-center justify-center text-violet-300 text-lg font-bold">
                📊
              </div>
              <h3 className="text-lg font-bold text-slate-100">Smart ATS Evaluation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Comprehensive score breakdown across formatting, keyword density, experience relevance, and completeness.
              </p>
            </div>

            <div className="bg-[#0f0b18] border border-[#1d162e] rounded-2xl p-6 space-y-3">
              <div className="size-10 rounded-xl bg-violet-950/50 border border-violet-800/30 flex items-center justify-center text-violet-300 text-lg font-bold">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-slate-100">Optional Context Analysis</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload your resume with a targeted job posting for precise keyword matching, or request general quality feedback.
              </p>
            </div>

            <div className="bg-[#0f0b18] border border-[#1d162e] rounded-2xl p-6 space-y-3">
              <div className="size-10 rounded-xl bg-violet-950/50 border border-violet-800/30 flex items-center justify-center text-violet-300 text-lg font-bold">
                💡
              </div>
              <h3 className="text-lg font-bold text-slate-100">Targeted Improvements</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Receive prioritised advice to highlight key achievements and remove ATS red flags.
              </p>
            </div>
          </div> */}
        </div>
      </>
    );
  }

  // Loading State
  if (!isLoaded || (isSignedIn && loading)) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
          <div className="size-10 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header & Workspace Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1d162e] pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <span className="text-violet-300 font-bold">{userName}</span>. Here is your resume performance summary.
          </p>
        </div>

        <Link
          href="/upload"
          className="px-5 py-2.5 text-sm font-bold rounded-xl bg-violet-800 hover:bg-violet-700 text-white transition-all shadow-sm flex items-center gap-2 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Resume Analysis
        </Link>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#0f0b18] border border-[#1d162e] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Resumes</p>
            <p className="text-3xl font-black text-slate-100 mt-1">{totalResumes}</p>
          </div>
          <div className="size-12 rounded-xl bg-violet-950/40 border border-violet-800/30 flex items-center justify-center text-violet-300 font-bold text-xl">
            📄
          </div>
        </div>

        <div className="bg-[#0f0b18] border border-[#1d162e] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average ATS Score</p>
            <p className="text-3xl font-black text-violet-300 mt-1">{avgScore ? `${avgScore}%` : "—"}</p>
          </div>
          <div className="size-12 rounded-xl bg-violet-950/40 border border-violet-800/30 flex items-center justify-center text-violet-300 font-bold text-xl">
            📈
          </div>
        </div>

        <div className="bg-[#0f0b18] border border-[#1d162e] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Matches (80%+)</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{highMatchCount}</p>
          </div>
          <div className="size-12 rounded-xl bg-emerald-950/30 border border-emerald-800/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
            🎯
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Control/Quick Upload Panel + Right Resume Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Quick Upload Widget & Filter Controls (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Upload Widget */}
          <div className="bg-[#0f0b18] border border-[#1d162e] rounded-2xl p-6 space-y-4 shadow-xl">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span className="size-2 rounded-full bg-violet-400" />
                Quick Resume Scanner
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Drop your file here for instant AI assessment. Job details are optional.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* File Drop Area */}
              {!quickFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border border-dashed border-[#261c3b] bg-[#07050d] hover:border-violet-600/40 hover:bg-[#0c0915] cursor-pointer transition-all">
                  <div className="text-center space-y-1.5 p-4">
                    <svg className="w-6 h-6 mx-auto text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-bold text-slate-200">
                      Select Resume <span className="text-violet-400 font-medium text-xs">(PDF/DOCX)</span>
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setQuickFile(e.target.files[0]);
                        setQuickError("");
                      }
                    }}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="rounded-xl border border-[#261c3b] bg-[#07050d] p-3.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate">{quickFile.name}</p>
                    <p className="text-xs text-slate-400">{(quickFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickFile(null)}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-300 px-2 py-1"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Optional Job Title */}
              <input
                type="text"
                placeholder="Target Job Title (Optional)"
                value={quickJobTitle}
                onChange={(e) => setQuickJobTitle(e.target.value)}
                className="w-full rounded-xl border border-[#1d162e] bg-[#07050d] px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/70"
              />

              {quickError && (
                <p className="text-xs text-rose-400 font-medium">{quickError}</p>
              )}

              <button
                onClick={handleQuickAnalyze}
                disabled={isQuickAnalyzing}
                className="w-full py-3 text-sm font-bold rounded-xl bg-violet-800 hover:bg-violet-700 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isQuickAnalyzing ? (
                  <>
                    <div className="size-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Run Scan</span>
                )}
              </button>
            </div>
          </div>

          {/* Search & Workspace Filter Navigation */}
          <div className="bg-[#0f0b18] border border-[#1d162e] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Filter Workspace
            </h2>

            {/* Search Input */}
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search job title or file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#1d162e] bg-[#07050d] pl-9 pr-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/70"
              />
            </div>

            {/* Tabs */}
            <div className="space-y-1.5 text-sm">
              <button
                onClick={() => setFilterTab("all")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${filterTab === "all"
                  ? "bg-violet-950/50 border border-violet-800/40 text-violet-200 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#150f24]"
                  }`}
              >
                <span>All Resumes</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#07050d] text-slate-300 font-semibold">{resumes.length}</span>
              </button>

              <button
                onClick={() => setFilterTab("high")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${filterTab === "high"
                  ? "bg-violet-950/50 border border-violet-800/40 text-violet-200 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#150f24]"
                  }`}
              >
                <span>High Score (80%+)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#07050d] text-emerald-400 font-bold">{highMatchCount}</span>
              </button>

              <button
                onClick={() => setFilterTab("recent")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${filterTab === "recent"
                  ? "bg-violet-950/50 border border-violet-800/40 text-violet-200 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#150f24]"
                  }`}
              >
                <span>Recent (Past 7 days)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Resume Feed / Inventory Cards (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-400 px-1">
            <span>Showing <strong className="text-slate-200">{filteredResumes.length}</strong> resumes</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-violet-400 hover:underline font-semibold"
              >
                Clear search
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-rose-950/30 border border-rose-900/40 p-4 text-sm text-rose-300 font-medium">
              {error}
            </div>
          )}

          {filteredResumes.length > 0 ? (
            <div className="space-y-4">
              {filteredResumes.map((resume) => {
                const ats = resume.atsScore;
                const scoreColor =
                  ats !== null
                    ? ats >= 80
                      ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/30"
                      : ats >= 60
                        ? "text-amber-400 border-amber-900/40 bg-amber-950/30"
                        : "text-rose-400 border-rose-900/40 bg-rose-950/30"
                    : "text-slate-400 border-slate-800 bg-slate-900/50";

                return (
                  <div
                    key={resume.id}
                    className="group rounded-2xl border border-[#1d162e] bg-[#0f0b18] p-6 shadow-lg hover:border-violet-600/40 hover:bg-[#130e20] transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link href={`/results?resumeId=${resume.id}`}>
                            <h3 className="text-lg font-bold text-slate-100 group-hover:text-violet-300 transition-colors truncate">
                              {resume.jobTitle || "General Resume Analysis"}
                            </h3>
                          </Link>
                          {ats !== null && (
                            <span className={`px-3 py-1 rounded-full border text-xs font-bold ${scoreColor}`}>
                              {ats.toFixed(0)}% Score
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-400 truncate">
                          📄 {resume.fileName} • Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(resume.id)}
                        disabled={deletingId === resume.id}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete Resume"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Job description preview snippet if present */}
                    {resume.jobDescription && (
                      <p className="text-sm text-slate-300 line-clamp-2 bg-[#07050d] p-3.5 rounded-xl border border-[#1a1329] leading-relaxed">
                        {resume.jobDescription.slice(0, 180)}...
                      </p>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#1a1329] text-sm">
                      <span className="text-slate-500 text-xs font-mono">
                        ID: {resume.id.slice(0, 8)}...
                      </span>

                      <Link
                        href={`/results?resumeId=${resume.id}`}
                        className="px-4 py-2 rounded-xl bg-violet-950/60 border border-violet-800/40 text-violet-300 hover:bg-violet-800 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        View Detailed Report →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl border border-[#1d162e] bg-[#0f0b18] p-12 text-center shadow-lg space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet-950/40 border border-violet-800/30 text-violet-300 text-2xl font-bold">
                📄
              </div>
              <h3 className="text-base font-bold text-slate-100">No matching resumes</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No resumes found matching "${searchQuery}".`
                  : "You have not uploaded any resumes yet. Use the Quick Scanner on the left or click 'New Resume Analysis'."}
              </p>
              <div className="pt-2">
                <Link
                  href="/upload"
                  className="px-5 py-2.5 text-sm font-bold rounded-xl bg-violet-800 hover:bg-violet-700 text-white transition-all inline-block"
                >
                  Analyze Resume
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
