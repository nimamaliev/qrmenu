import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter_Tight } from "next/font/google";
import { MotionConfig } from "motion/react";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { BRAND, SITE_URL } from "@/lib/site";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import "../globals.css";

// The brief's only typeface, two weights. Its Cyrillic subset covers the Russian pages.
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin", "latin-ext", "cyrillic"], weight: ["400", "500"] });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${BRAND} · ${dict.meta.title}`, template: `%s · ${BRAND}` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: { title: `${BRAND} · ${dict.meta.title}`, description: dict.meta.description, locale: lang, type: "website" },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className={`${interTight.variable} antialiased`}>
      <body className="min-h-svh">
        <MotionConfig reducedMotion="user">
          <Header lang={lang} dict={dict} />
          <main>{children}</main>
          <Footer lang={lang} dict={dict} />
        </MotionConfig>
      </body>
    </html>
  );
}
