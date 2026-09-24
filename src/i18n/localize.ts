import { getContentFallbacks, getContentKey, type ContentKey, type Locale } from "./config";

export type LocalizedText = Partial<Record<ContentKey, string>>;

export type Localized = {
  text: string;
  /** The locale the text is actually in; differs from the requested one on fallback. */
  locale: Locale;
  isFallback: boolean;
};

/** Picks the best translation of multilingual DB content for the current UI locale. */
export function localize(value: LocalizedText | null | undefined, locale: Locale): Localized | null {
  if (!value) return null;
  for (const candidate of getContentFallbacks(locale)) {
    const text = value[getContentKey(candidate)];
    if (typeof text === "string" && text.trim() !== "") {
      return { text, locale: candidate, isFallback: candidate !== locale };
    }
  }
  return null;
}
