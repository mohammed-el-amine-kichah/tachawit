import { describe, expect, it } from "vitest";
import { contributionSchema, contributorFor } from "./contribution";

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

describe("contributorFor", () => {
  const form = { name: "Someone Else", email: "spoof@example.com" };

  it("uses the account for signed-in contributors and ignores what the form sent", () => {
    expect(contributorFor({ displayName: "Yamina", email: "yamina@example.com" }, form)).toEqual({
      name: "Yamina",
      email: "yamina@example.com",
    });
  });

  it("leaves the name empty when the account has none, rather than trusting the form", () => {
    expect(contributorFor({ displayName: null, email: "yamina@example.com" }, form)).toEqual({ name: null, email: "yamina@example.com" });
  });

  it("uses the optional form fields for guests", () => {
    expect(contributorFor(null, form)).toEqual({ name: "Someone Else", email: "spoof@example.com" });
    expect(contributorFor(null, { name: null, email: null })).toEqual({ name: null, email: null });
  });
});
