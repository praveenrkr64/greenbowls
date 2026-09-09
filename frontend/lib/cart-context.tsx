"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartLine } from "./types";

interface CartContextValue {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "lineId">) => void;
  removeLine: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  // False until the initial localStorage read completes - consumers that redirect
  // on an empty cart (e.g. checkout) must wait for this, or a hard page load will
  // see the transient pre-hydration [] and bounce away before the real cart loads.
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "sprout-bowl-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt cart data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  function addLine(line: Omit<CartLine, "lineId">) {
    const lineId = `${line.menuItem.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setLines((prev) => [...prev, { ...line, lineId }]);
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }

  function updateQuantity(lineId: string, quantity: number) {
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, quantity: Math.max(1, quantity) } : l))
    );
  }

  function clearCart() {
    setLines([]);
  }

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [lines]
  );

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider
      value={{ lines, addLine, removeLine, updateQuantity, clearCart, subtotal, itemCount, hydrated }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
