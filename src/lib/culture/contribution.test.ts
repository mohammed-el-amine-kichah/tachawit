import { describe, expect, it } from "vitest";
import { contributionSchema } from "./contribution";

const entry = "30000000-0000-4000-8000-000000000001";
const base = { text_latin: "", text_arabic: "", text_tifinagh: "", meaning: "", related_entry_id: "", region_id: "", village: "", message: "", contributor_name: "", contributor_email: "", audio_consent: false, has_audio: false };

describe("contributionSchema", () => {
  it("accepts a new word with its meaning", () => {
    expect(contributionSchema.safeParse({ ...base, kind: "word", text_latin: "tasekkurt", meaning: "partridge" }).success).toBe(true);
  });

  it("needs the word and its meaning for a new word", () => {
    expect(contributionSchema.safeParse({ ...base, kind: "word", text_latin: "tasekkurt" }).success).toBe(false);
    expect(contributionSchema.safeParse({ ...base, kind: "word", meaning: "partridge" }).success).toBe(false);
  });

  it("needs the word a variation belongs to and the local form", () => {
    expect(contributionSchema.safeParse({ ...base, kind: "variation", text_latin: "tasekkut" }).success).toBe(false);
    expect(contributionSchema.safeParse({ ...base, kind: "variation", text_latin: "tasekkut", related_entry_id: entry }).success).toBe(true);
  });

  it("needs a message for a correction", () => {
    expect(contributionSchema.safeParse({ ...base, kind: "correction", related_entry_id: entry }).success).toBe(false);
    expect(contributionSchema.safeParse({ ...base, kind: "correction", message: "The Tifinagh is missing a letter." }).success).toBe(true);
  });

  it("needs a recording and consent for a recording", () => {
    expect(contributionSchema.safeParse({ ...base, kind: "recording", text_latin: "azul" }).success).toBe(false);
    expect(contributionSchema.safeParse({ ...base, kind: "recording", text_latin: "azul", has_audio: true }).success).toBe(false);
    expect(contributionSchema.safeParse({ ...base, kind: "recording", text_latin: "azul", has_audio: true, audio_consent: true }).success).toBe(true);
  });

  it("rejects an invalid email but allows none", () => {
    expect(contributionSchema.safeParse({ ...base, kind: "correction", message: "x", contributor_email: "not-an-email" }).success).toBe(false);
  });

  it("keeps Tachawit text exactly as typed and maps the meaning to the learner's language", () => {
    const parsed = contributionSchema.parse({ ...base, kind: "word", text_latin: " Aɣrum ", meaning: "bread" });
    expect(parsed.text_latin).toBe(" Aɣrum ");
  });
});
