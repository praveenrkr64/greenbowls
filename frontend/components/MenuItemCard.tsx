"use client";

import { useState } from "react";
import { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import CustomizeSheet from "./CustomizeSheet";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const customizable = item.variantGroups.length > 0;
  const hasDiscount = item.discountedPrice != null;

  return (
    <>
      <div className="bg-paper-raised border border-line rounded-2xl overflow-hidden">
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
        )}
        <div className="px-5 pt-5 pb-4">
          {/* sprout-dark, not sprout: the brighter green is about 3:1 on white and fails
              WCAG AA for text, while sprout-dark is ~5.5:1 and still clearly green. */}
          <h3 className="font-display text-xl font-semibold text-sprout-dark">{item.name}</h3>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed whitespace-pre-line">{item.description}</p>
        </div>

        {/* signature "spec strip" - nutrition-ticket style price/customization line */}
        <div className="ticket-rule mx-5" />
        <div className="flex items-center justify-between px-5 py-3">
          <div className="font-mono text-sm text-ink-soft">
            {customizable ? "from " : ""}
            {hasDiscount ? (
              <>
                <span className="line-through text-ink-soft/60 mr-1.5">{formatPrice(item.basePrice)}</span>
                <span className="text-clay text-base font-semibold">{formatPrice(item.discountedPrice!)}</span>
              </>
            ) : (
              <span className="text-ink text-base">{formatPrice(item.basePrice)}</span>
            )}
            {customizable && <span className="ml-2 text-clay">customizable</span>}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="rounded-full bg-turmeric text-ink font-semibold text-sm px-5 py-2 hover:bg-turmeric-dark transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {open && <CustomizeSheet item={item} onClose={() => setOpen(false)} />}
    </>
  );
}
