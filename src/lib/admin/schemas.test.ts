import { describe, expect, it } from "vitest";
import { entryFormSchema, regionFormSchema, speakerFormSchema } from "./schemas";

describe("entryFormSchema", () => {
  const valid = {
    text_latin: "aman",
    text_arabic: "",
    text_tifinagh: "ⴰⵎⴰⵏ",
    translations: { en: "water", fr: "", ar: "", dz: "" },
    part_of_speech: "noun",
    region_id: "",
    notes: "",
    image_path: "",
  };

  it("accepts a word with one translation and turns blanks into nulls", () => {
    const parsed = entryFormSchema.parse(valid);
    expect(parsed.text_arabic).toBeNull();
    expect(parsed.region_id).toBeNull();
    expect(parsed.translations).toEqual({ en: "water" });
  });

  it("keeps the Tachawit text exactly as typed", () => {
    expect(entryFormSchema.parse({ ...valid, text_latin: " Aɣrum " }).text_latin).toBe(" Aɣrum ");
  });

  it("requires the Latin spelling and at least one translation", () => {
    expect(entryFormSchema.safeParse({ ...valid, text_latin: "  " }).success).toBe(false);
    expect(entryFormSchema.safeParse({ ...valid, translations: { en: "", fr: "", ar: "", dz: "" } }).success).toBe(false);
  });
});

describe("speakerFormSchema", () => {
  const base = { display_name: "Yamina", region_id: "", village: "Merouana", consent_given: false, consent_date: "", bio: { en: "", fr: "", ar: "", dz: "" } };

  it("accepts a speaker without consent yet", () => {
    expect(speakerFormSchema.safeParse(base).success).toBe(true);
  });

  it("requires the date when consent is recorded, not in the future", () => {
    expect(speakerFormSchema.safeParse({ ...base, consent_given: true }).success).toBe(false);
    expect(speakerFormSchema.safeParse({ ...base, consent_given: true, consent_date: "2026-09-01" }).success).toBe(true);
    expect(speakerFormSchema.safeParse({ ...base, consent_given: true, consent_date: "2999-01-01" }).success).toBe(false);
  });

  it("drops an empty public bio", () => {
    expect(speakerFormSchema.parse(base).public_bio).toBeNull();
  });
});

describe("regionFormSchema", () => {
  it("needs a URL-friendly slug and a name", () => {
    expect(regionFormSchema.safeParse({ slug: "arris", name: { en: "Arris", fr: "", ar: "", dz: "" } }).success).toBe(true);
    expect(regionFormSchema.safeParse({ slug: "Arris Town", name: { en: "Arris", fr: "", ar: "", dz: "" } }).success).toBe(false);
  });
});
