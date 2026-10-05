import { localeNames, locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BRAND } from "@/lib/site";
import Logo from "./Logo";

export default function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted">{dict.footer.tagline}</p>
        </div>
        <nav aria-label={dict.nav.language} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {locales.map((l) => (
            <a
              key={l}
              href={`/${l}`}
              hrefLang={l}
              lang={l}
              aria-current={l === lang ? "page" : undefined}
              className="text-muted hover:text-text aria-[current=page]:text-text"
            >
              {localeNames[l]}
            </a>
          ))}
        </nav>
      </div>
      <p className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted sm:px-6">
        © {new Date().getFullYear()} {BRAND}. {dict.footer.rights}
      </p>
    </footer>
  );
}
