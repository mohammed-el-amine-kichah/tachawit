import { describe, expect, it } from "vitest";
import { quizQuestionsSchema } from "@/lib/content/quiz";
import { id, viewEntry } from "@/lib/quiz/fixtures";
import { buildReviewQuestions } from "./build";

const entries = Object.fromEntries(
  [viewEntry(1, "azul"), viewEntry(2, "azul fellawen"), viewEntry(3, "tanmirt"), viewEntry(4, "aman"), viewEntry(5, "adrar", { noAudio: true })].map((e) => [
    e.id,
    e,
  ]),
);

describe("buildReviewQuestions", () => {
  it("asks exactly one valid question per due entry, in order", () => {
    const questions = buildReviewQuestions([id(1), id(3), id(5)], entries, 11);
    expect(questions.map((q) => ("entryId" in q ? q.entryId : null))).toEqual([id(1), id(3), id(5)]);
    expect(quizQuestionsSchema.safeParse(questions).success).toBe(true);
  });

  it("uses a speaking question for an entry without audio", () => {
    const [question] = buildReviewQuestions([id(5)], entries, 11);
    expect(question.type).toBe("speak");
  });

  it("mixes question types across a session", () => {
    const types = new Set(buildReviewQuestions([id(1), id(2), id(3), id(4)], entries, 3).map((q) => q.type));
    expect(types.size).toBeGreaterThan(1);
  });

  it("skips due entries that are no longer published", () => {
    expect(buildReviewQuestions(["90000000-0000-4000-8000-000000000000"], entries, 1)).toEqual([]);
  });
});
