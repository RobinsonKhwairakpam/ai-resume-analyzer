"use client";

import Link from "next/link";
import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import SignInModal from "@/app/components/SignInModal";

export default function Navbar() {
  const { isSignedIn, isLoaded } = useUser();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {showSignInModal && (
        <SignInModal
          onClose={() => setShowSignInModal(false)}
          redirectUrl="/"
        />
      )}

      <header className="border-b border-[#1d162e] bg-black backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-950/60 border border-violet-800/40 text-violet-300 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-100 tracking-tight group-hover:text-violet-300 transition-colors">
                Resume<span className="text-violet-400">Analyzer</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center text-base gap-6 font-semibold text-slate-200">
              {isLoaded && (
                <>
                  <Link
                    href="/"
                    className="hover:text-violet-300 transition-colors py-1"
                  >
                    Dashboard
                  </Link>

                  {/* <Link
                    href="/upload"
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-violet-900/70 hover:bg-violet-800/80 border border-violet-700/50 text-violet-200 transition-all cursor-pointer shadow-sm"
                  >
                    + Analyze Resume
                  </Link> */}

                  <div className="pl-4 flex items-center border-l border-[#1d162e]">
                    {isSignedIn ? (
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox: "w-8 h-8 ring-2 ring-violet-500/30",
                          },
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setShowSignInModal(true)}
                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-violet-800 hover:bg-violet-700 text-white transition-all cursor-pointer shadow-sm"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-slate-300 hover:text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden absolute top-18 left-0 w-full bg-[#0a0714]/95 backdrop-blur-xl border-b border-[#1d162e] z-50">
          <div className="px-6 py-5 space-y-4 text-slate-200 font-semibold text-sm">
            {isLoaded && (
              <>
                <Link
                  href="/"
                  className="block hover:text-violet-300 py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className="block text-violet-300 py-1 font-bold"
                  onClick={() => setMobileOpen(false)}
                >
                  + Analyze Resume
                </Link>

                <div className="pt-3 border-t border-[#1d162e] flex items-center justify-between">
                  <span className="text-sm text-slate-400">Account</span>
                  {isSignedIn ? (
                    <UserButton />
                  ) : (
                    <button
                      onClick={() => {
                        setShowSignInModal(true);
                        setMobileOpen(false);
                      }}
                      className="text-sm text-violet-300 font-semibold"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
