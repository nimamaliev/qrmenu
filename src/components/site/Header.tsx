import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import Logo from "./Logo";
import LanguageMenu from "./LanguageMenu";
import MobileNav from "./MobileNav";
import { navLinks } from "./navLinks";

export default function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const links = navLinks(dict);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href={`/${lang}`} aria-label="Home">
          <Logo />
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-text">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageMenu lang={lang} label={dict.nav.language} />
          <a
            href="#contact"
            className="hidden h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-bg transition-colors hover:bg-accent-strong sm:flex"
          >
            {dict.nav.bookDemo}
          </a>
          <MobileNav links={[...links, { href: "#contact", label: dict.nav.bookDemo }]} menuLabel={dict.nav.menu} />
        </div>
      </div>
    </header>
  );
}
