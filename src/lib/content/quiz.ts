import { z } from "zod";
import { localizedTextSchema } from "./localized-text";
import { hasUniqueIds, hasUniqueValues, uniqueInOrder } from "./unique";

// Entry references use the keys `entryId`, `entryIds` and `distractorEntryIds` only:
// the database function public.referenced_entry_ids() relies on these names.

const questionBase = {
  id: z.string().min(1),
  /** Optional instruction overriding the default one for this question type. */
  prompt: localizedTextSchema.optional(),
};

const distractors = z.array(z.uuid()).max(5);

function distinctDistractors(q: { entryId: string; distractorEntryIds?: string[] }): boolean {
  const ids = q.distractorEntryIds ?? [];
  return !ids.includes(q.entryId) && hasUniqueValues(ids);
}

const distinctMessage = { message: "Distractors must be distinct and differ from the answer" };

const listenPickTranslation = z
  .strictObject({
    ...questionBase,
    type: z.literal("listen_pick_translation"),
    entryId: z.uuid(),
    distractorEntryIds: distractors.min(1),
  })
  .refine(distinctDistractors, distinctMessage);

const pickAudio = z
  .strictObject({
    ...questionBase,
    type: z.literal("pick_audio"),
    entryId: z.uuid(),
    distractorEntryIds: distractors.min(1),
  })
  .refine(distinctDistractors, distinctMessage);

/** Tiles are the words of the entry in the learner's script, plus words from distractor entries. */
const buildSentence = z
  .strictObject({
    ...questionBase,
    type: z.literal("build_sentence"),
    entryId: z.uuid(),
    distractorEntryIds: distractors.optional(),
  })
  .refine(distinctDistractors, distinctMessage);

const matchPairs = z
  .strictObject({
    ...questionBase,
    type: z.literal("match_pairs"),
    entryIds: z.array(z.uuid()).min(2).max(6),
  })
  .refine((q) => hasUniqueValues(q.entryIds), { message: "Pairs must be distinct" });

/** The word at `blankWordIndex` is hidden; options are that word plus the distractor entries. */
const fillBlank = z
  .strictObject({
    ...questionBase,
    type: z.literal("fill_blank"),
    entryId: z.uuid(),
    blankWordIndex: z.int().nonnegative(),
    distractorEntryIds: distractors.min(1),
  })
  .refine(distinctDistractors, distinctMessage);

/** Record yourself and compare by listening back. Not scored in v1. */
const speak = z.strictObject({
  ...questionBase,
  type: z.literal("speak"),
  entryId: z.uuid(),
});

export const quizQuestionSchema = z.discriminatedUnion("type", [
  listenPickTranslation,
  pickAudio,
  buildSentence,
  matchPairs,
  fillBlank,
  speak,
]);

export const quizQuestionsSchema = z
  .array(quizQuestionSchema)
  .refine(hasUniqueIds, { message: "Question ids must be unique" });

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizQuestionType = QuizQuestion["type"];

export function collectQuizEntryIds(questions: readonly QuizQuestion[]): string[] {
  return uniqueInOrder(
    questions.flatMap((q) =>
      q.type === "match_pairs" ? q.entryIds : [q.entryId, ...("distractorEntryIds" in q ? (q.distractorEntryIds ?? []) : [])],
    ),
  );
}
