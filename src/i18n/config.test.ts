import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  getContentFallbacks,
  getContentKey,
  getDirection,
  getHtmlLang,
  isLocale,
  localePrefixes,
  locales,
} from "./config";

describe("locales", () => {
  it("supports English, French, Arabic and Darja", () => {
    expect(locales).toEqual(["en", "fr", "ar", "ar-DZ"]);
  });

  it("identifies Darja as Algerian Arabic, not 'dz' (the code for Dzongkha)", () => {
    const formatted = new Intl.NumberFormat("ar-DZ").format(4);
    expect(formatted).toBe("4");
    expect(new Intl.PluralRules("ar-DZ").select(4)).toBe("few");
  });

  it("serves Darja under /dz and the others under their own code", () => {
    expect(localePrefixes).toEqual({ "ar-DZ": "/dz" });
  });

  it("stores Darja content under the 'dz' key", () => {
    expect(getContentKey("ar-DZ")).toBe("dz");
    expect(getContentKey("fr")).toBe("fr");
  });

  it("defaults to Arabic", () => {
    expect(defaultLocale).toBe("ar");
  });

  it("recognises supported locales only", () => {
    expect(isLocale("ar-DZ")).toBe(true);
    expect(isLocale("dz")).toBe(false);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("getDirection", () => {
  it("is RTL for Arabic and Darja", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("ar-DZ")).toBe("rtl");
  });

  it("is LTR for English and French", () => {
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("fr")).toBe("ltr");
  });
});

describe("getHtmlLang", () => {
  it("tags Darja as ar-DZ so screen readers pick an Arabic voice", () => {
    expect(getHtmlLang("ar-DZ")).toBe("ar-DZ");
  });

  it("uses the plain tag for the other locales", () => {
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

  it("falls back from Darja to Arabic before any Latin-script language", () => {
    expect(getContentFallbacks("ar-DZ").slice(0, 2)).toEqual(["ar-DZ", "ar"]);
  });

  it("falls back from Arabic to Darja before any Latin-script language", () => {
    expect(getContentFallbacks("ar").slice(0, 2)).toEqual(["ar", "ar-DZ"]);
  });
});
