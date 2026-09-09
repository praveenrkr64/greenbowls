"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

// Persistent slim header for every page past the main menu (cart, checkout,
// order confirmation, track orders) - always lets the user jump back to the
// menu or straight to their cart, no matter how deep they are in the flow.
export default function SiteHeader({ title }: { title: string }) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line">
      <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-sprout-dark transition-colors shrink-0"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 15 7.5 10l5-5" />
          </svg>
          Menu
        </Link>

        <span className="font-display text-base font-semibold text-ink truncate">{title}</span>

        <Link
          href="/cart"
          aria-label="View cart"
          className="relative flex items-center justify-center h-9 w-9 rounded-full border border-line text-ink-soft hover:text-ink hover:border-sprout transition-colors shrink-0"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4h2l1.2 9.6a1.5 1.5 0 0 0 1.5 1.4h6.6a1.5 1.5 0 0 0 1.5-1.3L17 7H5.2" />
            <circle cx="8" cy="17" r="1" fill="currentColor" stroke="none" />
            <circle cx="14" cy="17" r="1" fill="currentColor" stroke="none" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-turmeric text-ink text-[10px] font-bold flex items-center justify-center">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
