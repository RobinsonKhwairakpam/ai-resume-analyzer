"use client";

import { SignIn } from "@clerk/nextjs";

interface SignInModalProps {
  onClose: () => void;
  redirectUrl?: string;
}

export default function SignInModal({ onClose, redirectUrl = "/" }: SignInModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#15102a] border border-[#2d204d] rounded-2xl p-4 shadow-2xl shadow-purple-950/80">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-purple-900/30 cursor-pointer"
          aria-label="Close modal"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="flex justify-center pt-2">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full mx-auto",
                card: "bg-transparent shadow-none border-none p-0 w-full",
                headerTitle: "text-white text-xl font-bold",
                headerSubtitle: "text-slate-400 text-xs",
                socialButtonsBlockButton: "bg-[#1f173b] border-[#372763] text-slate-200 hover:bg-[#2a1f4e] hover:text-white transition-all text-xs font-semibold rounded-xl",
                formButtonPrimary: "bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-purple-950/50",
                formFieldInput: "bg-[#0f0c1d] border-[#2d204d] text-white focus:border-purple-500 rounded-xl text-sm",
                formFieldLabel: "text-slate-300 text-xs font-medium",
                footerActionLink: "text-purple-400 hover:text-purple-300 font-semibold",
                identityPreviewText: "text-slate-300",
                identityPreviewEditButton: "text-purple-400",
              },
            }}
            routing="hash"
            fallbackRedirectUrl={redirectUrl}
          />
        </div>
      </div>
    </div>
  );
}
