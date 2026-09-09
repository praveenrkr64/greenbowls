import type { CSSProperties } from "react";

export function formatPrice(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}

// Parses a raw CSS declarations string (e.g. "color: #ff6b35; font-weight: 800;")
// into a React inline-style object. Setting the parsed result via the `style` prop
// is safe: unlike innerHTML, style attribute values can't execute script.
export function parseInlineStyle(css: string | null | undefined): CSSProperties {
  if (!css) return {};
  const style: Record<string, string> = {};
  for (const declaration of css.split(";")) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex === -1) continue;
    const property = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();
    if (!property || !value) continue;
    const camelProperty = property.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[camelProperty] = value;
  }
  return style as CSSProperties;
}
