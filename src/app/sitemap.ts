import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";

// Every page in every language, each listing its translations (lab previews stay out: noindex).
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/demo"].flatMap((path) =>
    locales.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      changeFrequency: "monthly" as const,
      priority: path ? 0.6 : 1,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${SITE_URL}/${x}${path}`])) },
    })),
  );
}
