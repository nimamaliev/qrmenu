import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import BurgerStory from "@/components/home/hero/BurgerStory";
import TryIt from "@/components/home/TryIt";
import { Contact, Faq, HowItWorks, Owners, Plans } from "@/components/home/Sections";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <BurgerStory hero={dict.hero} story={dict.story} />
      <TryIt lang={lang} journey={dict.journey} />
      <HowItWorks how={dict.how} />
      <Owners lang={lang} owners={dict.owners} menu={dict.menu} />
      <Plans plans={dict.plans} />
      <Faq faq={dict.faq} />
      <Contact cta={dict.cta} />
    </>
  );
}
