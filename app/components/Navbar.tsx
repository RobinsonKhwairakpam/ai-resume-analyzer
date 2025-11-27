"use client";

import Link from "next/link";
import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import SignInModal from "@/app/components/SignInModal";

export default function Navbar() {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [showSignInModal, setShowSignInModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProtectedClick = (cb: () => void) => {
    if (!isSignedIn) {
      setShowSignInModal(true);
      return;
    }
    cb();
  };

  return (
    <>
      {/* Sign-in modal */}
      {showSignInModal && (
        <SignInModal
          onClose={() => setShowSignInModal(false)}
          redirectUrl="/upload"
        />
      )}

      {/* Navbar */}
      <nav className="border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-[1.4rem] font-bold text-transparent"
            >
              Resume Analyzer
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center text-[.95rem] gap-7 font-semibold text-gray-300">
              {isLoaded && (
                <>
                  {isSignedIn ? (
                    <>
                      <Link
                        href="/upload"
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        Upload
                      </Link>
                      <Link
                        href="/my-resumes"
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        My Resumes
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowSignInModal(true)}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        Upload
                      </button>
                      <button
                        onClick={() => setShowSignInModal(true)}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        My Resumes
                      </button>
                      <button
                        onClick={() => setShowSignInModal(true)}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        Log In
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <svg
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown — absolutely positioned ABOVE content */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-gray-900/95 backdrop-blur-lg border-b border-gray-800/50 z-50">
          <div className="px-6 py-4 space-y-4 text-gray-300 font-semibold">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <>
                    <Link
                      href="/upload"
                      className="block hover:text-white transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Upload
                    </Link>
                    <Link
                      href="/my-resumes"
                      className="block hover:text-white transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      My Resumes
                    </Link>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        signOut();
                      }}
                      className="block text-left w-full hover:text-white transition-colors"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowSignInModal(true);
                        setMobileOpen(false);
                      }}
                      className="block text-left w-full hover:text-white transition-colors"
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => {
                        setShowSignInModal(true);
                        setMobileOpen(false);
                      }}
                      className="block text-left w-full hover:text-white transition-colors"
                    >
                      My Resumes
                    </button>
                    <button
                      onClick={() => {
                        setShowSignInModal(true);
                        setMobileOpen(false);
                      }}
                      className="block text-left w-full hover:text-white transition-colors"
                    >
                      Log In
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
