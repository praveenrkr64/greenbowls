"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { CartIcon } from "./icons";

// Same key the checkout page saves to after a successful order - reused here
// purely for a "Hello, {name}" greeting, not to prefill anything.
const SAVED_DETAILS_KEY = "sprout-bowl-checkout-details";

export default function CartBar() {
  const { itemCount, subtotal } = useCart();
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_DETAILS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.customerName) setFirstName(String(saved.customerName).trim().split(/\s+/)[0]);
      }
    } catch {
      // ignore corrupt saved data
    }
  }, []);

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-sprout text-paper-raised">
      <Link href="/cart" className="max-w-2xl mx-auto flex items-center justify-between gap-3 px-5 py-4">
        <span className="flex items-center gap-3 min-w-0">
          {firstName && (
            <span className="shrink-0 h-9 w-9 rounded-full bg-ink/15 flex items-center justify-center font-display font-semibold text-sm">
              {firstName[0].toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            {firstName ? (
              <>
                <span className="block text-sm font-semibold truncate">Hello, {firstName}</span>
                <span className="block text-xs text-paper-raised/80">Good to see you!</span>
              </>
            ) : (
              <span className="font-semibold">
                {itemCount} item{itemCount > 1 ? "s" : ""} in your cart
              </span>
            )}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="flex items-center justify-end gap-1.5 text-sm font-semibold">
            <CartIcon className="h-4 w-4" />
            View Cart
            <span className="rounded-full bg-paper-raised text-sprout-dark text-[11px] font-bold h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          </span>
          <span className="block font-mono text-xs text-paper-raised/85 mt-0.5">{formatPrice(subtotal)}</span>
        </span>
      </Link>
    </div>
  );
}
