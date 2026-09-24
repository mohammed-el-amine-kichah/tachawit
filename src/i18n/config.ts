// Darja's locale is "ar-DZ" (Algerian Arabic), not "dz", which is the code for Dzongkha and makes
// Intl format numbers and plurals incorrectly. It is still served under /dz and stored under "dz".
export const locales = ["en", "fr", "ar", "ar-DZ"] as const;
export type Locale = (typeof locales)[number];
export type Direction = "ltr" | "rtl";

/** Key used for a locale in multilingual database content and in the message file names. */
export type ContentKey = "en" | "fr" | "ar" | "dz";

export const defaultLocale: Locale = "ar";

/** URL prefixes that differ from the locale code. */
export const localePrefixes = { "ar-DZ": "/dz" } as const satisfies Partial<Record<Locale, `/${string}`>>;

type LocaleMeta = {
  dir: Direction;
  contentKey: ContentKey;
  /** Order in which multilingual content is tried when a translation is missing. */
  contentFallbacks: readonly Locale[];
};

const localeMeta: Record<Locale, LocaleMeta> = {
  en: { dir: "ltr", contentKey: "en", contentFallbacks: ["en", "fr", "ar", "ar-DZ"] },
  fr: { dir: "ltr", contentKey: "fr", contentFallbacks: ["fr", "en", "ar", "ar-DZ"] },
  ar: { dir: "rtl", contentKey: "ar", contentFallbacks: ["ar", "ar-DZ", "fr", "en"] },
  "ar-DZ": { dir: "rtl", contentKey: "dz", contentFallbacks: ["ar-DZ", "ar", "fr", "en"] },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): Direction {
  return localeMeta[locale].dir;
}

/** BCP 47 tag for the `lang` attribute. */
export function getHtmlLang(locale: Locale): string {
  return locale;
}

export function getContentKey(locale: Locale): ContentKey {
  return localeMeta[locale].contentKey;
}

export function getContentFallbacks(locale: Locale): readonly Locale[] {
  return localeMeta[locale].contentFallbacks;
}
