import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { getDictionary } from "@/i18n/dictionaries";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import FloorStory from "@/components/lab/floor/FloorStory";

// Unlinked preview of the "QR -> restaurant floor" homepage concept; nothing here is final.
export const metadata: Metadata = { title: "Floor story · preview", robots: { index: false, follow: false } };

export default async function FloorLab({ params }: PageProps<"/[lang]/lab/floor">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <>
      <FloorStory url={new URL(`/${lang}/demo`, SITE_URL).toString()} lang={lang} owners={dict.owners} menu={dict.menu} />
      <section className="mx-auto max-w-3xl px-6 py-32 text-center">
        <p className="text-sm text-muted">Floor story · preview. Draft copy; the dashboard uses sample data.</p>
      </section>
    </>
  );
}
