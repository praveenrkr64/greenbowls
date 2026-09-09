// Small shared line-art icon set for the redesigned home page - kept as simple
// inline SVGs (stroke-based, 20x20 viewBox) to match the icon style already used
// elsewhere (SiteHeader, OrderCard) rather than pulling in an icon library.

export function LeafIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16c-1-6 2-11 12-11 1 6-2 11-12 11Z" />
      <path d="M4 16c2-4 5-7 9-9" />
    </svg>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M4.5 3A1.5 1.5 0 0 0 3 4.5v.5c0 7.18 5.82 13 13 13h.5a1.5 1.5 0 0 0 1.5-1.5v-1.55a1 1 0 0 0-.8-.98l-3.24-.65a1 1 0 0 0-1.02.42l-.6.86a10.05 10.05 0 0 1-4.94-4.94l.86-.6a1 1 0 0 0 .42-1.02l-.65-3.24a1 1 0 0 0-.98-.8H4.5Z" />
    </svg>
  );
}

export function MegaphoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3H13a1 1 0 0 1 .8.4l3.4 4.6a1 1 0 0 1 0 1.2l-3.4 4.6a1 1 0 0 1-.8.4H3.5A1.5 1.5 0 0 1 2 12.7v-8.2Z" />
    </svg>
  );
}

export function ChevronIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 5 12.5 10 7.5 15" />
    </svg>
  );
}

export function CartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l1.2 9.6a1.5 1.5 0 0 0 1.5 1.4h6.6a1.5 1.5 0 0 0 1.5-1.3L17 7H5.2" />
      <circle cx="8" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DumbbellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8v4M16 8v4M6 6v8M14 6v8M6 10h8" />
    </svg>
  );
}

export function DropletIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.5S4.5 9 4.5 12.5a5.5 5.5 0 0 0 11 0C15.5 9 10 2.5 10 2.5Z" />
    </svg>
  );
}

export function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.5 16.5 5v4.5c0 4.2-2.7 6.9-6.5 8-3.8-1.1-6.5-3.8-6.5-8V5L10 2.5Z" />
      <path d="M7.3 10 9.2 11.9 12.9 8.2" />
    </svg>
  );
}

export function HeartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 16.5s-6-3.6-6-8a3.5 3.5 0 0 1 6-2.4A3.5 3.5 0 0 1 16 8.5c0 4.4-6 8-6 8Z" />
    </svg>
  );
}

export function BowlIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h14a7 7 0 0 1-14 0Z" />
      <path d="M6.5 10V6M10 10V5M13.5 10V6" />
    </svg>
  );
}

export function EggIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17c3.3 0 5.5-2.3 5.5-5.8C15.5 7.5 12.8 3 10 3S4.5 7.5 4.5 11.2C4.5 14.7 6.7 17 10 17Z" />
    </svg>
  );
}

export function DrinkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h8l-1 12.5A1.5 1.5 0 0 1 11.5 17h-3A1.5 1.5 0 0 1 7 15.5L6 3Z" />
      <path d="M6.5 7h7" />
    </svg>
  );
}

export function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8a5 5 0 0 1 10 0c0 3.5 1 4.5 1.5 5.5H3.5C4 12.5 5 11.5 5 8Z" />
      <path d="M8.2 16a1.8 1.8 0 0 0 3.6 0" />
    </svg>
  );
}

export function SproutIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17V10" />
      <path d="M10 10C10 6 7 5 4 5c0 3.5 2 5.5 6 5Z" />
      <path d="M10 10c0-3.5 2.5-5 6-5 0 3-1.5 5.5-6 5Z" />
    </svg>
  );
}

// Receipt/orders - the header shortcut to "Track my orders", sitting beside the phone
// because both are ways of reaching us about an order rather than menu navigation.
export function ReceiptIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2.5h10v15l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V2.5Z" />
      <path d="M8 6.5h4M8 9.5h4M8 12.5h2" />
    </svg>
  );
}

// "Who we are" - paired with the About button next to Order Now.
export function InfoIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v4.5" />
      <circle cx="10" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
