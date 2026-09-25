import type { WordTimestamp } from "@/lib/content/word-timestamps";

/** Closest two cuts may be, so every word keeps a playable slice. */
export const MIN_WORD_MS = 40;
const SILENCE = 0.08;

/**
 * Word timings from cuts made in the recording: one cut where the first word starts, one between
 * each pair of words, and one where the last word ends (words + 1 cuts, in order).
 */
export function timestampsFromCuts(words: readonly string[], cuts: readonly number[]): WordTimestamp[] | null {
  if (words.length === 0 || cuts.length !== words.length + 1) return null;
  if (cuts.some((c, i) => i > 0 && c - cuts[i - 1] < MIN_WORD_MS)) return null;
  return words.map((word, i) => ({ word, startMs: Math.round(cuts[i]), endMs: Math.round(cuts[i + 1]) }));
}

/** The cuts behind saved timings, or null if they do not match these words. */
export function cutsFromTimestamps(words: readonly string[], timestamps: readonly WordTimestamp[] | null, durationMs: number): number[] | null {
  if (!timestamps || timestamps.length !== words.length || words.length === 0) return null;
  const last = timestamps[timestamps.length - 1];
  return [...timestamps.map((t) => t.startMs), Math.min(durationMs, last.endMs ?? durationMs)];
}

/**
 * A first guess to adjust by hand: the voiced part of the recording is shared between the words
 * in proportion to their length, and each boundary moves to the quietest moment nearby.
 * `peaks` is the waveform (0..1 per bar) spread evenly over `durationMs`.
 */
export function suggestCuts(words: readonly string[], peaks: readonly number[], durationMs: number): number[] {
  const bars = peaks.length;
  const msPerBar = bars ? durationMs / bars : durationMs;
  const voiced = peaks.map((p, i) => (p > SILENCE ? i : -1)).filter((i) => i >= 0);
  const start = voiced.length ? voiced[0] * msPerBar : 0;
  const end = voiced.length ? Math.min(durationMs, (voiced[voiced.length - 1] + 1) * msPerBar) : durationMs;

  const lengths = words.map((w) => Math.max(1, [...w].length));
  const total = lengths.reduce((sum, n) => sum + n, 0);
  const window = ((end - start) / Math.max(1, words.length)) * 0.35;

  let covered = 0;
  const inner = lengths.slice(0, -1).map((n) => {
    covered += n;
    const guess = start + ((end - start) * covered) / total;
    if (!bars) return guess;
    const from = Math.max(0, Math.floor((guess - window) / msPerBar));
    const to = Math.min(bars - 1, Math.ceil((guess + window) / msPerBar));
    let quietest = Math.min(bars - 1, Math.max(0, Math.round(guess / msPerBar)));
    for (let i = from; i <= to; i++) if (peaks[i] < peaks[quietest]) quietest = i;
    return (quietest + 0.5) * msPerBar;
  });

  const cuts = [start, ...inner, end];
  // Keep them in order and apart even when the guesses crowd together.
  for (let i = 1; i < cuts.length; i++) cuts[i] = Math.max(cuts[i], cuts[i - 1] + MIN_WORD_MS);
  for (let i = cuts.length - 1; i >= 0; i--) {
    const ceiling = i === cuts.length - 1 ? durationMs : cuts[i + 1] - MIN_WORD_MS;
    cuts[i] = Math.max(0, Math.min(cuts[i], ceiling));
  }
  return cuts.map(Math.round);
}

/** Moves one cut, staying between its neighbours and inside the recording. */
export function moveCut(cuts: readonly number[], index: number, toMs: number, durationMs: number): number[] {
  const low = index === 0 ? 0 : cuts[index - 1] + MIN_WORD_MS;
  const high = index === cuts.length - 1 ? durationMs : cuts[index + 1] - MIN_WORD_MS;
  const next = [...cuts];
  next[index] = Math.round(Math.min(high, Math.max(low, toMs)));
  return next;
}
