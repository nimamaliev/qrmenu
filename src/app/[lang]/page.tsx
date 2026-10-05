import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import PizzaStory from "@/components/home/pizza/PizzaStory";
import GuestJourney from "@/components/home/GuestJourney";
import { Contact, Faq, HowItWorks, Owners, Plans } from "@/components/home/Sections";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <PizzaStory hero={dict.hero} story={dict.story} />
      <GuestJourney lang={lang} journey={dict.journey} menu={dict.menu} />
      <HowItWorks how={dict.how} />
      <Owners lang={lang} owners={dict.owners} menu={dict.menu} />
      <Plans plans={dict.plans} />
      <Faq faq={dict.faq} />
      <Contact cta={dict.cta} />
    </>
  );
}
