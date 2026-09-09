"use client";

import { useState } from "react";
import { MegaphoneIcon } from "./icons";

export default function PromoBannerBar({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="px-5 mt-4 max-w-sm mx-auto">
      <div className="relative flex items-center gap-3 rounded-2xl bg-turmeric px-4 py-3 shadow-fresh">
        <span className="shrink-0 h-9 w-9 rounded-full bg-paper-raised text-turmeric-dark flex items-center justify-center">
          <MegaphoneIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold text-ink text-[15px] leading-snug">{message}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1.5 text-ink/60 hover:text-ink hover:bg-paper-raised/60 transition-colors"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M5 5l10 10M15 5 5 15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
