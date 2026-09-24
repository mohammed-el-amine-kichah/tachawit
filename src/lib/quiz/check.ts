import { normalizeWord } from "@/lib/audio/karaoke";

/** True when the learner's words match the expected words in order (case and punctuation aside). */
export function sameSequence(given: readonly string[], expected: readonly string[]): boolean {
  return given.length === expected.length && given.every((word, i) => normalizeWord(word) === normalizeWord(expected[i]));
}
