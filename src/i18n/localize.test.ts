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
    expect(localize({ ar: "مرحبا", en: "Hello" }, "ar-DZ")).toEqual({
      text: "مرحبا",
      locale: "ar",
      isFallback: true,
    });
  });

  it("reads Darja from the 'dz' content key", () => {
    expect(localize({ dz: "سلام", ar: "مرحبا" }, "ar-DZ")).toEqual({ text: "سلام", locale: "ar-DZ", isFallback: false });
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
