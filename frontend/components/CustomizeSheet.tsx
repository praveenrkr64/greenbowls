"use client";

import { useMemo, useRef, useState } from "react";
import { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

export default function CustomizeSheet({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) {
  const { addLine } = useCart();
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);
  // Errors appear only after an attempt, so a sheet that has just opened is not
  // already shouting at a customer who has not done anything yet.
  const [showErrors, setShowErrors] = useState(false);
  const groupRefs = useRef<Record<number, HTMLFieldSetElement | null>>({});

  function toggleOption(groupId: number, optionId: number, max: number) {
    setSelected((prev) => {
      const current = prev[groupId] || [];
      const isSelected = current.includes(optionId);

      if (isSelected) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }

      if (max === 1) {
        return { ...prev, [groupId]: [optionId] };
      }

      if (current.length >= max) return prev; // at cap, ignore
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  const unitPrice = useMemo(() => {
    let price = item.discountedPrice ?? item.basePrice;
    for (const group of item.variantGroups) {
      const chosen = selected[group.id] || [];
      for (const optId of chosen) {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) price += opt.priceDelta;
      }
    }
    return price;
  }, [selected, item]);

  // required implies at least one choice even when minSelect says 0. Live data has groups
  // flagged required with minSelect 0, and comparing against the raw value ("0 < 0") meant a
  // mandatory group was never reported missing -- the item went into the cart unconfigured.
  // The server applies exactly the same rule, so the two cannot disagree.
  const effectiveMin = (g: { required: boolean; minSelect: number }) =>
    g.required && g.minSelect < 1 ? 1 : g.minSelect;

  const missingGroupIds = item.variantGroups
    .filter((g) => (selected[g.id] || []).length < effectiveMin(g))
    .map((g) => g.id);
  const missingRequired = missingGroupIds.length > 0;

  function handleAddToCart() {
    if (missingRequired) {
      // A disabled button explains nothing -- the customer sees a dead control and no reason.
      // Say what is missing, and put the cursor on the first group that needs an answer.
      setShowErrors(true);
      const firstMissing = missingGroupIds[0];
      const el = groupRefs.current[firstMissing];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }

    const selections = item.variantGroups.flatMap((group) =>
      (selected[group.id] || []).map((optId) => {
        const opt = group.options.find((o) => o.id === optId)!;
        return {
          groupId: group.id,
          groupName: group.name,
          optionId: opt.id,
          optionName: opt.name,
          priceDelta: opt.priceDelta,
        };
      })
    );

    addLine({ menuItem: item, quantity, selections, unitPrice });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-paper-raised rounded-t-3xl sm:rounded-3xl border border-line shadow-2xl">
        <div className="sticky top-0 bg-paper-raised px-6 pt-5 pb-4 border-b border-line flex items-start justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-sprout">{item.category}</p>
            <h2 className="font-display text-2xl font-semibold text-sprout-dark">{item.name}</h2>
            {item.discountedPrice != null && (
              <p className="font-mono text-sm mt-1">
                <span className="line-through text-ink-soft/60 mr-1.5">{formatPrice(item.basePrice)}</span>
                <span className="text-clay font-semibold">{formatPrice(item.discountedPrice)}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink text-2xl leading-none px-2"
            aria-label="Close customization"
          >
            &times;
          </button>
        </div>

        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
        )}

        <div className="px-6 py-4 space-y-6">
          <p className="text-sm text-ink-soft whitespace-pre-line">{item.description}</p>

          {item.variantGroups.map((group) => (
            <fieldset
              key={group.id}
              ref={(el) => {
                groupRefs.current[group.id] = el;
              }}
              className={
                showErrors && missingGroupIds.includes(group.id)
                  ? "scroll-mt-24 rounded-xl border border-clay/50 bg-clay/5 p-3 -m-3"
                  : "scroll-mt-24"
              }
            >
              <legend className="flex items-baseline justify-between w-full mb-2">
                <span className="font-semibold text-ink">
                  {group.name}
                  {group.required && <span className="text-clay"> *</span>}
                </span>
                <span className="font-mono text-xs text-ink-soft">
                  {group.maxSelect === 1 ? "choose 1" : `choose up to ${group.maxSelect}`}
                </span>
              </legend>
              {showErrors && missingGroupIds.includes(group.id) && (
                <p className="text-sm text-clay font-medium mb-2">
                  Please choose {effectiveMin(group) === 1 ? "an option" : `at least ${effectiveMin(group)} options`} for {group.name}.
                </p>
              )}
              <div className="space-y-2">
                {group.options.map((opt) => {
                  const checked = (selected[group.id] || []).includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                        checked
                          ? "border-sprout bg-leaf-pale"
                          : "border-line bg-paper hover:border-ink-soft"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type={group.maxSelect === 1 ? "radio" : "checkbox"}
                          name={`group-${group.id}`}
                          checked={checked}
                          onChange={() => toggleOption(group.id, opt.id, group.maxSelect)}
                          className="accent-sprout w-4 h-4"
                        />
                        <span className="text-ink">{opt.name}</span>
                      </span>
                      <span className="font-mono text-sm text-ink-soft">
                        {opt.priceDelta > 0 ? `+${formatPrice(opt.priceDelta)}` : "incl."}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="sticky bottom-0 bg-paper-raised border-t border-line px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 font-mono">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full border border-line text-ink flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full border border-line text-ink flex items-center justify-center"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <span className="font-mono text-lg text-ink">{formatPrice(unitPrice * quantity)}</span>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full rounded-xl bg-sprout text-paper-raised font-semibold py-3.5 hover:bg-sprout-dark transition-colors"
          >
            {"Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
