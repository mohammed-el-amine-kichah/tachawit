import { z } from "zod";

const optionalText = (max: number) => z.string().max(max).transform((value) => (value.trim() === "" ? null : value));

/**
 * What a speaker sends with a recording. Every written field is optional: speakers write in the
 * scripts they choose, and Tachawit text is kept exactly as typed.
 */
export const recordingSchema = z.object({
  text_latin: optionalText(200),
  text_arabic: optionalText(200),
  text_tifinagh: optionalText(200),
  /** Meaning in the speaker's interface language, for words recorded without a prompt. */
  meaning: optionalText(200),
  /** The word the speaker was asked to say, if any. */
  prompt_entry_id: z.union([z.uuid(), z.literal("")]).transform((value) => (value === "" ? null : value)),
});
