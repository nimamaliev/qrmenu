import { BRAND } from "@/lib/site";

export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      {/* A QR finder square with a dish inside: scan → see the food. */}
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="8" fill="none" stroke="var(--accent)" strokeWidth="3" />
        <circle cx="16" cy="16" r="6.5" fill="var(--saffron)" />
        <circle cx="16" cy="16" r="3.5" fill="var(--accent)" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">{BRAND}</span>
    </span>
  );
}
