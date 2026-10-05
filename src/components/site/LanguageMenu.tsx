import { localeNames, locales, type Locale } from "@/i18n/config";

/** Native popover: light-dismiss and keyboard handling come free, no JS shipped. */
export default function LanguageMenu({ lang, label }: { lang: Locale; label: string }) {
  return (
    <>
      <button
        type="button"
        popoverTarget="language-menu"
        className="flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium uppercase hover:border-muted"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
        </svg>
        <span className="sr-only">{label}: </span>
        {lang}
      </button>
      <div
        id="language-menu"
        popover="auto"
        className="fixed inset-auto top-16 right-4 m-0 w-48 rounded-2xl border border-line bg-surface p-2 text-text shadow-2xl"
      >
        {locales.map((l) => (
          <a
            key={l}
            href={`/${l}`}
            hrefLang={l}
            lang={l}
            aria-current={l === lang ? "page" : undefined}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-surface-2 aria-[current=page]:text-accent"
          >
            {localeNames[l]}
            <span className="text-xs uppercase text-muted">{l}</span>
          </a>
        ))}
      </div>
    </>
  );
}
