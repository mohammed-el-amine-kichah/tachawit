import type { WordTimestamp } from "@/lib/content/word-timestamps";

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Lowercase, without surrounding punctuation, for matching a word against the glossary. */
export function normalizeWord(word: string): string {
  return word.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "").toLocaleLowerCase();
}

/** Index of the word being spoken at `timeMs`, or -1 between words. */
export function activeWordIndex(words: readonly WordTimestamp[], timeMs: number): number {
  let index = -1;
  for (let i = 0; i < words.length && words[i].startMs <= timeMs; i++) index = i;
  if (index === -1) return -1;
  const end = words[index].endMs;
  return end !== undefined && timeMs > end ? -1 : index;
}

/** Start and end of one word, to play it on its own. */
export function wordSegment(words: readonly WordTimestamp[], index: number, durationMs: number) {
  const word = words[index];
  return { startMs: word.startMs, endMs: word.endMs ?? words[index + 1]?.startMs ?? durationMs };
}

/** Timings for the words as displayed, or null if they cannot be matched one to one. */
export function alignTimestamps(
  words: readonly WordTimestamp[] | null,
  displayed: readonly string[],
): readonly WordTimestamp[] | null {
  return words && words.length === displayed.length ? words : null;
}

/** Timings stretched for a recording played `factor` times slower. */
export function scaleTimestamps(words: readonly WordTimestamp[], factor: number): WordTimestamp[] {
  return words.map((w) => ({
    word: w.word,
    startMs: Math.round(w.startMs * factor),
    ...(w.endMs !== undefined ? { endMs: Math.round(w.endMs * factor) } : {}),
  }));
}
