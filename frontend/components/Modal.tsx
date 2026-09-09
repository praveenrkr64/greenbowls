"use client";

import { useEffect } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-5">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-paper-raised w-full sm:max-w-lg sm:rounded-2xl shadow-fresh max-h-screen sm:max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-paper-raised border-b border-line px-5 py-4 flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-ink">{title}</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center h-8 w-8 rounded-full text-ink-soft hover:text-ink hover:bg-line/50 transition-colors"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M5 5l10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
