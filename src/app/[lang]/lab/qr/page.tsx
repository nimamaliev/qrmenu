import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import QrScene from "@/components/qr3d/QrScene";

// Unlinked test page for the 3D QR idea; it moves into "Try it yourself" once approved.
export const metadata: Metadata = { title: "3D QR lab", robots: { index: false, follow: false } };

export default async function QrLab({ params }: PageProps<"/[lang]/lab/qr">) {
  const { lang } = await params;
  return (
    <section className="mx-auto max-w-5xl px-4 pt-28 pb-[60svh] sm:px-6">
      <p className="text-[12.5px] tracking-[0.045em] text-muted uppercase">Lab · 3D QR</p>
      <h1 className="headline mt-4 text-[clamp(2.6rem,5.4vw,4.75rem)]">Scroll down: the table turns into a QR code</h1>
      <div className="mt-[40svh]">
        <QrScene
          url={new URL(`/${lang}/demo`, SITE_URL).toString()}
          labels={{ toQr: "Show the QR code", to3d: "Show the 3D table", hint: "Tap the scene to switch" }}
        />
      </div>
    </section>
  );
}
