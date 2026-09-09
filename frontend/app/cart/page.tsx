"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";

export default function CartPage() {
  const { lines, removeLine, updateQuantity, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <main className="min-h-screen">
        <SiteHeader title="Your cart" />
        <div className="flex flex-col items-center justify-center px-6 text-center py-24">
          <p className="font-display text-2xl text-ink mb-2">Your cart is empty</p>
          <p className="text-ink-soft text-sm mb-6">Add a bowl or a drink to get started.</p>
          <Link href="/" className="rounded-full bg-sprout text-paper-raised font-semibold px-6 py-3">
            Browse menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-32 max-w-2xl mx-auto">
      <SiteHeader title="Your cart" />

      <div className="px-5 mt-6 space-y-4">
        {lines.map((line) => (
          <div key={line.lineId} className="bg-paper-raised border border-line rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ink">{line.menuItem.name}</p>
                {line.selections.length > 0 && (
                  <ul className="text-xs text-ink-soft mt-1 space-y-0.5">
                    {line.selections.map((s) => (
                      <li key={s.optionId}>
                        {s.groupName}: {s.optionName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => removeLine(line.lineId)}
                className="text-xs text-clay underline"
              >
                Remove
              </button>
            </div>

            <div className="ticket-rule mt-3 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-3 font-mono text-sm">
                <button
                  onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                  className="w-7 h-7 rounded-full border border-line flex items-center justify-center"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>{line.quantity}</span>
                <button
                  onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-line flex items-center justify-center"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className="font-mono text-ink">
                {formatPrice(line.unitPrice * line.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-0 right-0 px-5">
        <div className="max-w-2xl mx-auto bg-paper-raised border border-line rounded-2xl shadow-fresh px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-ink-soft text-sm">Subtotal</span>
            <span className="font-mono text-lg text-ink">{formatPrice(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="block text-center rounded-xl bg-sprout text-paper-raised font-semibold py-3.5 hover:bg-sprout-dark transition-colors"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
