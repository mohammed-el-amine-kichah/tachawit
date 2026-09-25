import { describe, expect, it } from "vitest";
import { recordingSchema } from "./recording";

const entry = "30000000-0000-4000-8000-000000000001";
const base = { text_latin: "", text_arabic: "", text_tifinagh: "", meaning: "", prompt_entry_id: "" };

describe("recordingSchema", () => {
  it("accepts a recording with nothing written: every written field is the speaker's choice", () => {
    expect(recordingSchema.parse(base)).toEqual({ text_latin: null, text_arabic: null, text_tifinagh: null, meaning: null, prompt_entry_id: null });
  });

  it("accepts any mix of scripts", () => {
    const parsed = recordingSchema.parse({ ...base, text_arabic: "أمان", text_tifinagh: "ⴰⵎⴰⵏ", prompt_entry_id: entry });
    expect(parsed).toMatchObject({ text_latin: null, text_arabic: "أمان", text_tifinagh: "ⴰⵎⴰⵏ", prompt_entry_id: entry });
  });

  it("keeps Tachawit text exactly as typed", () => {
    expect(recordingSchema.parse({ ...base, text_latin: " Aɣrum " }).text_latin).toBe(" Aɣrum ");
  });

  it("rejects a prompt that is not an entry id and text that is too long", () => {
    expect(recordingSchema.safeParse({ ...base, prompt_entry_id: "water" }).success).toBe(false);
    expect(recordingSchema.safeParse({ ...base, text_latin: "a".repeat(201) }).success).toBe(false);
  });
});
