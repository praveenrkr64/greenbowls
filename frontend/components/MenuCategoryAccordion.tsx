"use client";

import { useState } from "react";
import { Category, MenuItem } from "@/lib/types";
import MenuItemCard from "./MenuItemCard";
import { BowlIcon, ChevronIcon, DrinkIcon, EggIcon, SproutIcon } from "./icons";

// Best-effort icon match by keyword in the category name (categories are free
// text, admin-set - this can't be exhaustive, so it falls back to a plain bowl).
function iconForCategory(category: string) {
  const c = category.toLowerCase();
  if (c.includes("sprout")) return SproutIcon;
  if (c.includes("rice") || c.includes("burrito")) return BowlIcon;
  if (c.includes("egg") || c.includes("chicken")) return EggIcon;
  if (c.includes("drink") || c.includes("detox") || c.includes("juice")) return DrinkIcon;
  return BowlIcon;
}

export default function MenuCategoryAccordion({ menu, categories: categoryDescriptions }: { menu: MenuItem[]; categories: Category[] }) {
  const categories = Array.from(new Set(menu.map((m) => m.category)));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(category: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const items = menu.filter((m) => m.category === category);
        const isOpen = expanded.has(category);
        const Icon = iconForCategory(category);
        // Prefer the admin-set category description so customers understand what the
        // category is about; fall back to borrowing an item's own description when no
        // category description has been set yet.
        const categoryDescription = categoryDescriptions.find(
          (c) => c.name.toLowerCase() === category.toLowerCase()
        )?.description;
        const blurb = categoryDescription || items.find((i) => i.description)?.description;
        return (
          <section key={category} className="border border-line rounded-2xl overflow-hidden bg-paper-raised">
            <button
              onClick={() => toggle(category)}
              className="w-full flex items-center gap-4 px-4 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="shrink-0 h-11 w-11 rounded-full bg-leaf-pale text-sprout-dark flex items-center justify-center">
                <Icon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-base font-semibold text-ink">{category}</span>
                  <span className="rounded-full bg-leaf-pale px-2.5 py-0.5 text-[11px] font-semibold text-sprout-dark">
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </span>
                </span>
                {blurb && <span className="block text-xs text-ink-soft mt-0.5 line-clamp-2">{blurb}</span>}
              </span>
              <ChevronIcon
                className={`shrink-0 h-4 w-4 text-ink-soft transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 grid gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
