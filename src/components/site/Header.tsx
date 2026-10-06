import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import Logo from "./Logo";
import LanguageMenu from "./LanguageMenu";
import MobileNav from "./MobileNav";
import { navLinks } from "./navLinks";

export default function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const links = navLinks(dict, lang);
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-linear-to-b from-bg/95 via-bg/80 via-70% to-transparent pb-4">
      <span aria-hidden="true" className="meter absolute inset-x-0 top-0 h-0.5 bg-text/55" />
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href={`/${lang}`} aria-label="Home">
          <Logo />
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-[14.5px] tracking-[-0.008em] text-text/85 transition-colors hover:text-text">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageMenu lang={lang} label={dict.nav.language} />
          <a
            href={`/${lang}#contact`}
            className="pill hidden h-10 px-5 text-[14.5px] sm:inline-flex"
          >
            {dict.nav.bookDemo}
          </a>
          <MobileNav links={[...links, { href: `/${lang}#contact`, label: dict.nav.bookDemo }]} menuLabel={dict.nav.menu} />
        </div>
      </div>
    </header>
  );
}
