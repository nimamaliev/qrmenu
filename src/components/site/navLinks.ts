import type { Dictionary } from "@/i18n/dictionaries";

export const navLinks = (dict: Dictionary) => [
  { href: "#how-it-works", label: dict.nav.howItWorks },
  { href: "#owners", label: dict.nav.owners },
  { href: "#plans", label: dict.nav.plans },
  { href: "#faq", label: dict.nav.faq },
];
