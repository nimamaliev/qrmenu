"use client";

import { useState } from "react";

export default function MobileNav({
  links,
  menuLabel,
}: {
  links: { href: string; label: string }[];
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
        className="grid h-10 w-10 place-items-center rounded-full border border-line"
      >
        <span className="sr-only">{menuLabel}</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <nav id="mobile-nav" className="absolute inset-x-4 top-full mt-2 rounded-2xl border border-line bg-surface p-2 shadow-2xl">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-lg hover:bg-surface-2">
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
