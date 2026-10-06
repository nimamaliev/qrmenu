import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/** Home-page sections, linked absolutely so they also work from the demo page. */
export const navLinks = (dict: Dictionary, lang: Locale) => [
  { href: `/${lang}#how-it-works`, label: dict.nav.howItWorks },
  { href: `/${lang}#owners`, label: dict.nav.owners },
  { href: `/${lang}#plans`, label: dict.nav.plans },
  { href: `/${lang}#faq`, label: dict.nav.faq },
];
