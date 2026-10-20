import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import DishViewer from "@/components/demo/DishViewer";
import { DEMO_DISH, DISHES } from "@/lib/dishes";

export async function generateMetadata({ params }: PageProps<"/[lang]/demo">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.demo.metaTitle,
    description: dict.demo.text,
    alternates: {
      canonical: `/${lang}/demo`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/demo`])),
    },
  };
}

/** Where the QR code on the home page leads: the demo dish (DEMO_DISH) as a real-time 3D model with AR. */
export default async function Demo({ params }: PageProps<"/[lang]/demo">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { demo } = await getDictionary(lang);

  return (
    <section className="mx-auto flex min-h-svh max-w-6xl flex-col px-4 pt-24 pb-10 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:pt-16">
      <div className="text-center lg:w-[26rem] lg:shrink-0 lg:text-left">
        <p className="flex items-center justify-center gap-2 text-[12.5px] tracking-[0.045em] text-muted uppercase lg:justify-start">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
          {demo.eyebrow}
        </p>
        <h1 className="headline mt-4 text-[clamp(2.6rem,5.4vw,4.75rem)] text-balance">{demo.title}</h1>
        <p className="mt-4 text-pretty text-muted lg:text-lg">{demo.text}</p>
        <p className="mt-6 hidden text-sm text-muted lg:block">{demo.note}</p>
        <a href={`/${lang}`} className="pill-ghost mt-6 hidden h-11 px-5 text-sm lg:inline-flex">
          ← {demo.back}
        </a>
      </div>
      <div className="relative mt-6 h-[min(58svh,30rem)] lg:mt-0 lg:h-[min(44rem,80svh)] lg:flex-1">
        <DishViewer dish={DISHES[DEMO_DISH]} alt={demo.dishes[DEMO_DISH]} arLabel={demo.ar} autoAR />
      </div>
      <p className="mt-4 text-center text-sm text-pretty lg:hidden">{demo.hint}</p>
      <p className="mt-2 text-center text-sm text-muted lg:hidden">{demo.note}</p>
      <a href={`/${lang}`} className="pill-ghost mx-auto mt-4 h-11 px-5 text-sm lg:hidden">
        ← {demo.back}
      </a>
    </section>
  );
}
