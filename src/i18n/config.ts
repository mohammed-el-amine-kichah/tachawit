export const locales = ["en", "fr", "ar"] as const;
export type Locale = (typeof locales)[number];
export type Direction = "ltr" | "rtl";

/** Key used for a locale in multilingual database content and in the message file names. */
export type ContentKey = "en" | "fr" | "ar";

/** Every language multilingual content is written in, in editing order. */
export const contentKeys = ["en", "fr", "ar"] as const satisfies readonly ContentKey[];

export const defaultLocale: Locale = "ar";

type LocaleMeta = {
  dir: Direction;
  contentKey: ContentKey;
  /** Order in which multilingual content is tried when a translation is missing. */
  contentFallbacks: readonly Locale[];
};

const localeMeta: Record<Locale, LocaleMeta> = {
  en: { dir: "ltr", contentKey: "en", contentFallbacks: ["en", "fr", "ar"] },
  fr: { dir: "ltr", contentKey: "fr", contentFallbacks: ["fr", "en", "ar"] },
  ar: { dir: "rtl", contentKey: "ar", contentFallbacks: ["ar", "fr", "en"] },
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
