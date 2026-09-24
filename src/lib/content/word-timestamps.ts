import { z } from "zod";

export const wordTimestampSchema = z
  .strictObject({
    word: z.string().min(1),
    startMs: z.int().nonnegative(),
    endMs: z.int().nonnegative().optional(),
  })
  .refine((w) => w.endMs === undefined || w.endMs > w.startMs, {
    message: "A word must end after it starts",
  });

/** Word-level timings of an audio clip, used for karaoke-style highlighting. */
export const wordTimestampsSchema = z
  .array(wordTimestampSchema)
  .refine((words) => words.every((w, i) => i === 0 || w.startMs > words[i - 1].startMs), {
    message: "Words must be in chronological order",
  });

export type WordTimestamp = z.infer<typeof wordTimestampSchema>;
