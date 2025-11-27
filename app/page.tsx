"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import SignInModal from "@/app/components/SignInModal";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [showSignInModal, setShowSignInModal] = useState(false);

  const handleUploadClick = () => {
    if (isLoaded && isSignedIn) {
      router.push("/upload");
    } else if (isLoaded) {
      setShowSignInModal(true);
    }
  };

  return (
    <>
      {showSignInModal && (
        <SignInModal
          onClose={() => setShowSignInModal(false)}
          redirectUrl="/upload"
        />
      )}
      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center py-20 text-center">
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Analyze Your Resume with
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Artificial Intelligence
            </span>
          </h1>

          <p className="mb-12 max-w-[46rem] text-lg leading-8 text-gray-400 sm:text-xl">
            Get instant feedback on your resume with our advanced AI analyzer.
            Discover strengths, identify areas for improvement, and optimize
            your resume to land your dream job.
          </p>

          <button
            onClick={handleUploadClick}
            className="group relative overflow-hidden rounded-lg bg-slate-600/30 cursor-pointer backdrop-blur-sm px-8 py-[.85rem] text-[1.04rem] font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-400/30 hover:border-gray-300/50"
          >
            <span className="relative z-10 flex items-center gap-2 ">
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Resume
            </span>
            {/* Shining hover effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </button>
        </div>
      </main>
    </>
  );
}
