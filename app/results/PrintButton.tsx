"use client";

import React from "react";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#171126] hover:bg-[#201835] text-slate-200 border border-[#261c3b] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 002-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Report</span>
        </button>
    );
}
