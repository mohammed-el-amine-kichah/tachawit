import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  getContentFallbacks,
  getContentKey,
  getDirection,
  getHtmlLang,
  isLocale,
  locales,
} from "./config";

describe("locales", () => {
  it("supports English, French and Arabic", () => {
    expect(locales).toEqual(["en", "fr", "ar"]);
  });

  it("stores content under each locale's own code", () => {
    for (const locale of locales) expect(getContentKey(locale)).toBe(locale);
  });

  it("defaults to Arabic", () => {
    expect(defaultLocale).toBe("ar");
  });

  it("recognises supported locales only", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("dz")).toBe(false);
    expect(isLocale("ar-DZ")).toBe(false);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("getDirection", () => {
  it("is RTL for Arabic", () => {
    expect(getDirection("ar")).toBe("rtl");
  });

  it("is LTR for English and French", () => {
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("fr")).toBe("ltr");
  });
});

describe("getHtmlLang", () => {
  it("uses the locale's own tag", () => {
    expect(getHtmlLang("en")).toBe("en");
    expect(getHtmlLang("fr")).toBe("fr");
    expect(getHtmlLang("ar")).toBe("ar");
  });
});

describe("getContentFallbacks", () => {
  it("starts with the requested locale and covers every locale exactly once", () => {
    for (const locale of locales) {
      const chain = getContentFallbacks(locale);
      expect(chain[0]).toBe(locale);
      expect([...chain].sort()).toEqual([...locales].sort());
    }
  });

  it("falls back from Arabic to French, the second language most learners read", () => {
    expect(getContentFallbacks("ar")).toEqual(["ar", "fr", "en"]);
  });
});
