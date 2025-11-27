"use client";

import React from "react";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="rounded-lg border border-gray-700 bg-gray-800/50 px-6 py-3 font-semibold text-gray-300 transition-all duration-300 hover:bg-gray-700/50 hover:text-white"
        >
            Print Report
        </button>
    );
}
