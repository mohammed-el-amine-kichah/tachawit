import { describe, expect, it } from "vitest";
import { collectLessonEntryIds, lessonStepsSchema } from "./lesson";

const azul = "0b8f5a7e-3c1d-4e2f-9a6b-7c8d9e0f1a2b";
const tanmirt = "1c9a6b8f-4d2e-4f3a-8b7c-8d9e0f1a2b3c";
const clip = "2d0b7c9a-5e3f-4a4b-9c8d-9e0f1a2b3c4d";

describe("lessonStepsSchema", () => {
  it("accepts every step type", () => {
    const result = lessonStepsSchema.safeParse([
      { id: "s1", type: "introduce", entryId: azul, audioClipId: clip },
      { id: "s2", type: "listen_repeat", entryId: azul },
      { id: "s3", type: "culture_note", body: { en: "Azul is used across Tamazgha." } },
      {
        id: "s4",
        type: "dialogue",
        lines: [
          { speaker: "A", entryId: azul },
          { speaker: "B", entryId: tanmirt },
        ],
      },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate step ids", () => {
    const result = lessonStepsSchema.safeParse([
      { id: "s1", type: "introduce", entryId: azul },
      { id: "s1", type: "listen_repeat", entryId: azul },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects an unknown step type", () => {
    expect(lessonStepsSchema.safeParse([{ id: "s1", type: "karaoke", entryId: azul }]).success).toBe(false);
  });

  it("rejects entry references that are not UUIDs", () => {
    expect(lessonStepsSchema.safeParse([{ id: "s1", type: "introduce", entryId: "azul" }]).success).toBe(false);
  });

  it("requires a culture note to link a note or carry its own body", () => {
    expect(lessonStepsSchema.safeParse([{ id: "s1", type: "culture_note" }]).success).toBe(false);
    expect(
      lessonStepsSchema.safeParse([{ id: "s1", type: "culture_note", cultureNoteId: clip }]).success,
    ).toBe(true);
  });

  it("requires a dialogue to have at least two lines", () => {
    const result = lessonStepsSchema.safeParse([
      { id: "s1", type: "dialogue", lines: [{ speaker: "A", entryId: azul }] },
    ]);
    expect(result.success).toBe(false);
  });
});

describe("collectLessonEntryIds", () => {
  it("lists every entry a lesson references, once, in order of appearance", () => {
    const steps = lessonStepsSchema.parse([
      { id: "s1", type: "introduce", entryId: azul },
      { id: "s2", type: "culture_note", body: { en: "Note" } },
      {
        id: "s3",
        type: "dialogue",
        lines: [
          { speaker: "A", entryId: tanmirt },
          { speaker: "B", entryId: azul },
        ],
      },
    ]);
    expect(collectLessonEntryIds(steps)).toEqual([azul, tanmirt]);
  });
});
