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

import { levelFormSchema, unitFormSchema } from "./schemas";

describe("unitFormSchema", () => {
  const base = { slug: "first-words", title: { en: "First words", fr: "", ar: "", dz: "" }, description: { en: "", fr: "", ar: "", dz: "" }, map_theme: "aures_peaks", cover_image_path: "" };

  it("accepts a unit and drops an empty description", () => {
    const parsed = unitFormSchema.parse(base);
    expect(parsed.description).toBeNull();
    expect(parsed.cover_image_path).toBeNull();
  });

  it("needs a known map theme and a title", () => {
    expect(unitFormSchema.safeParse({ ...base, map_theme: "moon" }).success).toBe(false);
    expect(unitFormSchema.safeParse({ ...base, title: { en: "", fr: "", ar: "", dz: "" } }).success).toBe(false);
  });
});

describe("levelFormSchema", () => {
  const lesson = "50000000-0000-4000-8000-000000000001";
  const quiz = "60000000-0000-4000-8000-000000000001";
  const base = { type: "lesson", title: { en: "", fr: "", ar: "", dz: "" }, lesson_id: lesson, quiz_id: "", unlock_rule: { type: "previous_completed" } };

  it("links lesson levels to a lesson and clears the quiz", () => {
    expect(levelFormSchema.parse({ ...base, quiz_id: quiz })).toMatchObject({ lesson_id: lesson, quiz_id: null, title: null });
  });

  it("links quiz levels to a quiz and clears the lesson", () => {
    expect(levelFormSchema.parse({ ...base, type: "boss", quiz_id: quiz })).toMatchObject({ lesson_id: null, quiz_id: quiz });
  });

  it("links nothing for review levels", () => {
    expect(levelFormSchema.parse({ ...base, type: "review" })).toMatchObject({ lesson_id: null, quiz_id: null });
  });

  it("validates the unlock rule", () => {
    expect(levelFormSchema.safeParse({ ...base, unlock_rule: { type: "unit_stars", minStars: 0 } }).success).toBe(false);
  });
});
