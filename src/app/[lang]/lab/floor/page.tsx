import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import FloorStory from "@/components/lab/floor/FloorStory";

// Unlinked preview of the "QR -> restaurant floor" homepage concept; nothing here is final.
export const metadata: Metadata = { title: "Floor story · preview", robots: { index: false, follow: false } };

export default async function FloorLab({ params }: PageProps<"/[lang]/lab/floor">) {
  const { lang } = await params;
  return (
    <>
      <FloorStory url={new URL(`/${lang}/demo`, SITE_URL).toString()} />
      <section className="mx-auto max-w-3xl px-6 py-32 text-center">
        <p className="text-sm text-muted">Floor story · preview. Draft copy; the dashboard and analytics use sample data and features still to be confirmed.</p>
      </section>
    </>
  );
}
