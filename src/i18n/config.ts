export const locales = ["en", "de", "fr", "es", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  ru: "Русский",
};

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);
