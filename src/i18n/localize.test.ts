import { describe, expect, it } from "vitest";
import { localize } from "./localize";

describe("localize", () => {
  it("returns the text in the requested locale", () => {
    expect(localize({ en: "Hello", fr: "Bonjour" }, "fr")).toEqual({
      text: "Bonjour",
      locale: "fr",
      isFallback: false,
    });
  });

  it("falls back along the locale's fallback chain and reports it", () => {
    expect(localize({ fr: "Bonjour", en: "Hello" }, "ar")).toEqual({
      text: "Bonjour",
      locale: "fr",
      isFallback: true,
    });
  });

  it("treats blank strings as missing", () => {
    expect(localize({ fr: "   ", en: "Hello" }, "fr")?.text).toBe("Hello");
  });

  it("returns null when nothing is available", () => {
    expect(localize({}, "en")).toBeNull();
    expect(localize(null, "en")).toBeNull();
    expect(localize(undefined, "ar")).toBeNull();
  });

  it("returns the stored text untouched (no trimming or normalisation)", () => {
    expect(localize({ en: " Azul " }, "en")?.text).toBe(" Azul ");
  });
});
