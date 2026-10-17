import QRCode from "qrcode";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { SITE_URL } from "@/lib/site";
import FocusHeadline from "@/components/site/FocusHeadline";

/**
 * The guest journey, explained by letting the visitor live it: a real QR code that opens the
 * hero burger in 3D on their own phone. Visitors already on a phone get a button instead.
 */
export default async function TryIt({ lang, journey }: { lang: Locale; journey: Dictionary["journey"] }) {
  const href = `/${lang}/demo`;
  const qr = await QRCode.toString(new URL(href, SITE_URL).toString(), {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0d0c0b", light: "#00000000" },
  });
  const t = journey.demo;

  return (
    <section id="guests" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
      <div className="max-w-4xl">
        <p className="flex items-center gap-2 text-[12.5px] tracking-[0.045em] text-muted uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {journey.eyebrow}
        </p>
        <FocusHeadline text={journey.title} className="mt-4 text-[clamp(2.75rem,6.2vw,5.5rem)] text-balance" />
        <p className="mt-4 text-lg text-muted">{journey.subtitle}</p>
      </div>

      <div className="mt-14 grid items-start gap-12 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-20">
        <ol className="divide-y divide-line border-y border-line">
          {journey.steps.map((step, i) => (
            <li key={step.title} className="reveal grid grid-cols-[3.5rem_1fr] items-baseline gap-x-4 py-6 sm:grid-cols-[5rem_1fr]">
              <span className="headline text-5xl text-text/25 sm:text-6xl">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-xl font-medium tracking-[-0.01em] sm:text-2xl">{step.title}</h3>
                <p className="mt-1.5 max-w-md text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="reveal rounded-[2rem] border border-line bg-surface p-7 sm:p-9 lg:sticky lg:top-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-text px-3 py-1 text-xs font-medium text-bg">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
            {t.label}
          </p>
          <h3 className="mt-5 font-display text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.05] tracking-display text-balance">{t.title}</h3>
          <p className="mt-3 text-pretty text-muted">{t.text}</p>

          {/* Desktop: scan it with your phone. */}
          <div className="mt-8 hidden items-center gap-6 md:flex">
            <a href={href} className="relative block w-44 shrink-0 p-4" aria-label={t.open}>
              {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "right-0 bottom-0 border-r-2 border-b-2"].map((pos) => (
                <span key={pos} className={`absolute h-6 w-6 rounded-[3px] border-accent ${pos}`} aria-hidden="true" />
              ))}
              <span className="block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            </a>
            <div className="text-sm">
              <p className="font-medium">{t.scan}</p>
              <p className="mt-1 text-muted">{t.noApp}</p>
              <a href={href} className="mt-4 inline-block text-muted underline underline-offset-4 hover:text-text">
                {t.open} →
              </a>
            </div>
          </div>

          {/* On a phone already: just open it. */}
          <a href={href} className="pill mt-8 h-12 w-full text-[15px] md:hidden">
            {t.open}
          </a>
        </div>
      </div>
    </section>
  );
}
