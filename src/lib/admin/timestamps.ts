import type { WordTimestamp } from "@/lib/content/word-timestamps";

const GAP_MS = 20;

/**
 * Word timings from taps made while the clip plays: one tap as each word starts, plus an optional
 * final tap where the last word ends. Returns null until every word is tapped in order.
 */
export function timestampsFromTaps(words: readonly string[], taps: readonly number[], durationMs: number): WordTimestamp[] | null {
  if (words.length === 0 || taps.length < words.length) return null;
  if (taps.some((t, i) => i > 0 && t <= taps[i - 1])) return null;

  const result = words.map((word, i) => {
    const startMs = Math.round(taps[i]);
    const nextStart = taps[i + 1];
    const endMs = Math.round(nextStart !== undefined ? (i < words.length - 1 ? nextStart - GAP_MS : nextStart) : durationMs);
    return { word, startMs, endMs };
  });
  return result.every((w) => w.endMs > w.startMs) ? result : null;
}
