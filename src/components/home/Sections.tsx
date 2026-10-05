import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { CONTACT_EMAIL } from "@/lib/site";
import Magnet from "@/components/react-bits/Magnet/Magnet";
import SpotlightCard from "@/components/react-bits/SpotlightCard/SpotlightCard";
import OwnerDashboard from "./OwnerDashboard";

function Heading({ eyebrow, title, subtitle, center = false }: { eyebrow: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={`reveal max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="text-sm font-medium tracking-[0.2em] text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-muted">{subtitle}</p>}
    </div>
  );
}

const icon = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const STEP_ICONS = [
  // camera
  <svg key="0" {...icon}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>,
  // cube
  <svg key="1" {...icon}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></svg>,
  // qr
  <svg key="2" {...icon}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" /></svg>,
  // dish on a table
  <svg key="3" {...icon}><ellipse cx="12" cy="12" rx="8" ry="3.5" /><path d="M8 11.5c1-1.5 7-1.5 8 0" /><path d="M3 18h18" /></svg>,
];

const FEATURE_ICONS = [
  <svg key="orders" {...icon}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>,
  <svg key="bills" {...icon}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></svg>,
  <svg key="wait" {...icon}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>,
  <svg key="staff" {...icon}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.4 0 4 1.6 4.5 4" /></svg>,
  <svg key="menu" {...icon}><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></svg>,
  <svg key="stats" {...icon}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
];

export function HowItWorks({ how }: { how: Dictionary["how"] }) {
  return (
    <section id="how-it-works" className="border-y border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
        <Heading eyebrow={how.eyebrow} title={how.title} subtitle={how.subtitle} />
        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {how.steps.map((step, i) => (
            <li key={step.title} className="reveal relative rounded-3xl border border-line bg-bg p-6">
              <span className="absolute top-6 right-6 font-display text-5xl font-semibold text-line">{i + 1}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/12 text-accent [&>svg]:h-6 [&>svg]:w-6">
                {STEP_ICONS[i]}
              </span>
              <h3 className="mt-6 font-display text-2xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Owners({ lang, owners, menu }: { lang: Locale; owners: Dictionary["owners"]; menu: Dictionary["menu"] }) {
  return (
    <section id="owners" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
      <Heading eyebrow={owners.eyebrow} title={owners.title} subtitle={owners.subtitle} />
      <div className="mt-12">
        <OwnerDashboard lang={lang} owners={owners} menu={menu} />
      </div>
      <ul className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {owners.features.map((f, i) => (
          <li key={f.title} className="reveal flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-saffron [&>svg]:h-5 [&>svg]:w-5">
              {FEATURE_ICONS[i]}
            </span>
            <div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-muted">{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Plans({ plans }: { plans: Dictionary["plans"] }) {
  const last = plans.items.length - 1;
  return (
    <section id="plans" className="border-y border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
        <Heading eyebrow={plans.eyebrow} title={plans.title} subtitle={plans.subtitle} center />
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {plans.items.map((plan, i) => (
            <SpotlightCard
              key={plan.name}
              spotlightColor="rgba(255, 106, 61, 0.18)"
              className={`reveal flex flex-col ${i === last ? "border-accent/60! lg:-my-4 lg:py-12" : ""}`}
            >
              {i === last && (
                <span className="mb-4 self-start rounded-full bg-accent px-3 py-1 text-xs font-semibold text-bg">{plans.highlight}</span>
              )}
              <h3 className="font-display text-3xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-muted">{plan.text}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 10.5l3 3 7-7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="relative mt-auto pt-8">
                <a
                  href="#contact"
                  className={`flex h-12 items-center justify-center rounded-full font-semibold transition-colors ${
                    i === last ? "bg-accent text-bg hover:bg-accent-strong" : "border border-line hover:border-muted"
                  }`}
                >
                  {plans.cta}
                </a>
              </div>
            </SpotlightCard>
          ))}
        </div>
        <p className="reveal mt-10 text-center text-muted">{plans.note}</p>
      </div>
    </section>
  );
}

export function Faq({ faq }: { faq: Dictionary["faq"] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
  };
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:py-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Heading eyebrow={faq.eyebrow} title={faq.title} center />
      <div className="mt-12 divide-y divide-line border-y border-line">
        {faq.items.map((it) => (
          <details key={it.q} name="faq" className="group py-2">
            <summary className="flex cursor-pointer items-center justify-between gap-6 py-4 text-lg font-medium">
              {it.q}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-accent transition-transform group-open:rotate-45">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </span>
            </summary>
            <p className="pb-5 text-muted">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Contact({ cta }: { cta: Dictionary["cta"] }) {
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(cta.emailSubject)}`;
  return (
    <section id="contact" className="px-4 pb-24 sm:px-6 lg:pb-32">
      <div className="reveal relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-line bg-[radial-gradient(circle_at_20%_0%,rgb(255_106_61/0.28),transparent_55%),radial-gradient(circle_at_90%_100%,rgb(242_184_75/0.18),transparent_50%)] bg-surface px-6 py-16 text-center sm:px-12 sm:py-20">
        <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">{cta.title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{cta.text}</p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Magnet padding={80} magnetStrength={3}>
            <a href={href} className="inline-flex h-14 items-center rounded-full bg-accent px-9 text-lg font-semibold text-bg transition-colors hover:bg-accent-strong">
              {cta.button}
            </a>
          </Magnet>
          <a href={href} className="text-sm text-muted underline-offset-4 hover:text-text hover:underline">
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}
