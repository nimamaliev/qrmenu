import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SITE_URL } from "@/lib/site";
import FloorStory from "@/components/home/floor/FloorStory";
import { Contact, Faq, HowItWorks, Plans } from "@/components/home/Sections";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <FloorStory url={new URL(`/${lang}/demo`, SITE_URL).toString()} lang={lang} copy={dict.floor} owners={dict.owners} menu={dict.menu} />
      <HowItWorks how={dict.how} />
      <Plans plans={dict.plans} />
      <Faq faq={dict.faq} />
      <Contact cta={dict.cta} />
    </>
  );
}
