"use client";

import { SignIn } from "@clerk/nextjs";

interface SignInModalProps {
  onClose: () => void;
  redirectUrl?: string;
}

export default function SignInModal({ onClose, redirectUrl = "/upload" }: SignInModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md rounded-xl">
        <button
          onClick={onClose}
          className="absolute right-9 top-3 z-10 text-gray-700 transition-colors hover:text-purple-500 cursor-pointer"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-cap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-transparent shadow-none",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                formButtonPrimary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90",
                formFieldInput: "bg-gray-800 border-gray-700 text-white",
                formFieldLabel: "text-gray-300",
                footerActionLink: "text-purple-400 hover:text-purple-300",
                identityPreviewText: "text-gray-300",
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
