import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales } from "@/i18n/config";

function preferredLocale(request: NextRequest) {
  const header = request.headers.get("accept-language") ?? "";
  // "de-CH,de;q=0.9,en;q=0.8" → ["de", "de", "en"], already ordered by preference in practice.
  // ponytail: ignores q-values; add a proper matcher if visitors report the wrong language.
  const wanted = header.split(",").map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase());
  return wanted.find(hasLocale) ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;

  request.nextUrl.pathname = `/${preferredLocale(request)}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next internals, API routes and files with an extension (favicon, images).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
