import { z } from "zod";
import { localizedTextSchema } from "./localized-text";
import { hasUniqueIds, uniqueInOrder } from "./unique";

// Entry references use the keys `entryId`, `entryIds` and `distractorEntryIds` only:
// the database function public.referenced_entry_ids() relies on these names.

const stepId = z.string().min(1);

const introduceStep = z.strictObject({
  id: stepId,
  type: z.literal("introduce"),
  entryId: z.uuid(),
  audioClipId: z.uuid().optional(),
});

const listenRepeatStep = z.strictObject({
  id: stepId,
  type: z.literal("listen_repeat"),
  entryId: z.uuid(),
  audioClipId: z.uuid().optional(),
});

const cultureNoteStep = z
  .strictObject({
    id: stepId,
    type: z.literal("culture_note"),
    cultureNoteId: z.uuid().optional(),
    title: localizedTextSchema.optional(),
    body: localizedTextSchema.optional(),
    imagePath: z.string().min(1).optional(),
  })
  .refine((step) => step.cultureNoteId !== undefined || step.body !== undefined, {
    message: "A culture note needs a linked note or its own text",
  });

const dialogueLine = z.strictObject({
  speaker: z.string().min(1).max(40),
  entryId: z.uuid(),
  audioClipId: z.uuid().optional(),
});

const dialogueStep = z.strictObject({
  id: stepId,
  type: z.literal("dialogue"),
  title: localizedTextSchema.optional(),
  lines: z.array(dialogueLine).min(2),
});

export const lessonStepSchema = z.discriminatedUnion("type", [
  introduceStep,
  listenRepeatStep,
  cultureNoteStep,
  dialogueStep,
]);

export const lessonStepsSchema = z
  .array(lessonStepSchema)
  .refine(hasUniqueIds, { message: "Step ids must be unique" });

export type LessonStep = z.infer<typeof lessonStepSchema>;
export type LessonStepType = LessonStep["type"];

export function collectLessonEntryIds(steps: readonly LessonStep[]): string[] {
  return uniqueInOrder(
    steps.flatMap((step) => {
      switch (step.type) {
        case "introduce":
        case "listen_repeat":
          return [step.entryId];
        case "dialogue":
          return step.lines.map((line) => line.entryId);
        case "culture_note":
          return [];
      }
    }),
  );
}
