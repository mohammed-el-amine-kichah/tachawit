import type { MetadataRoute } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

const PUBLIC_PATHS = ["", "/culture", "/about", "/contribute"];

function localized(origin: string, locale: Locale, path: string): string {
  return `${origin}/${locale}${path}`;
}

/** Public pages, one entry per page with every language as an alternate. */
export function sitemapEntries(origin: string, cultureSlugs: readonly string[]): MetadataRoute.Sitemap {
  const paths = [...PUBLIC_PATHS, ...cultureSlugs.map((slug) => `/culture/${encodeURIComponent(slug)}`)];
  return paths.map((path) => ({
    url: localized(origin, defaultLocale, path),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
    alternates: {
      languages: {
        ...Object.fromEntries(locales.map((locale) => [locale, localized(origin, locale, path)])),
        "x-default": localized(origin, defaultLocale, path),
      },
    },
  }));
}
