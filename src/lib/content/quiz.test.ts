import { describe, expect, it } from "vitest";
import { collectQuizEntryIds, quizQuestionsSchema } from "./quiz";

const ids = [
  "0b8f5a7e-3c1d-4e2f-9a6b-7c8d9e0f1a2b",
  "1c9a6b8f-4d2e-4f3a-8b7c-8d9e0f1a2b3c",
  "2d0b7c9a-5e3f-4a4b-9c8d-9e0f1a2b3c4d",
  "3e1c8d0b-6f4a-4b5c-8d9e-0f1a2b3c4d5e",
] as const;
const [a, b, c, d] = ids;

describe("quizQuestionsSchema", () => {
  it("accepts all six question types", () => {
    const result = quizQuestionsSchema.safeParse([
      { id: "q1", type: "listen_pick_translation", entryId: a, distractorEntryIds: [b, c] },
      { id: "q2", type: "pick_audio", entryId: a, distractorEntryIds: [b] },
      { id: "q3", type: "build_sentence", entryId: d },
      { id: "q4", type: "match_pairs", entryIds: [a, b, c] },
      { id: "q5", type: "fill_blank", entryId: d, blankWordIndex: 1, distractorEntryIds: [a, b] },
      { id: "q6", type: "speak", entryId: a },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate question ids", () => {
    const result = quizQuestionsSchema.safeParse([
      { id: "q1", type: "speak", entryId: a },
      { id: "q1", type: "speak", entryId: b },
    ]);
    expect(result.success).toBe(false);
  });

  it("needs at least one distractor for multiple-choice questions", () => {
    expect(
      quizQuestionsSchema.safeParse([
        { id: "q1", type: "listen_pick_translation", entryId: a, distractorEntryIds: [] },
      ]).success,
    ).toBe(false);
  });

  it("rejects a distractor that is the correct answer", () => {
    expect(
      quizQuestionsSchema.safeParse([
        { id: "q1", type: "pick_audio", entryId: a, distractorEntryIds: [b, a] },
      ]).success,
    ).toBe(false);
  });

  it("rejects repeated distractors", () => {
    expect(
      quizQuestionsSchema.safeParse([
        { id: "q1", type: "pick_audio", entryId: a, distractorEntryIds: [b, b] },
      ]).success,
    ).toBe(false);
  });

  it("needs between two and six distinct pairs to match", () => {
    const pairs = (entryIds: string[]) =>
      quizQuestionsSchema.safeParse([{ id: "q1", type: "match_pairs", entryIds }]).success;
    expect(pairs([a])).toBe(false);
    expect(pairs([a, a])).toBe(false);
    expect(pairs([a, b])).toBe(true);
    expect(pairs([...ids, ...ids.map((id) => id.replace(/^./, "9"))])).toBe(false);
  });

  it("rejects a negative blank position", () => {
    expect(
      quizQuestionsSchema.safeParse([
        { id: "q1", type: "fill_blank", entryId: a, blankWordIndex: -1, distractorEntryIds: [b] },
      ]).success,
    ).toBe(false);
  });
});

describe("collectQuizEntryIds", () => {
  it("lists every entry a quiz references, including distractors, once", () => {
    const questions = quizQuestionsSchema.parse([
      { id: "q1", type: "listen_pick_translation", entryId: a, distractorEntryIds: [b, c] },
      { id: "q2", type: "match_pairs", entryIds: [c, d] },
      { id: "q3", type: "speak", entryId: a },
    ]);
    expect(collectQuizEntryIds(questions)).toEqual([a, b, c, d]);
  });
});
