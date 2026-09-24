const MIN_CLIP_MS = 200;
const seconds = (ms: number) => (ms / 1000).toFixed(3);

/**
 * ffmpeg arguments to turn an upload into web audio: trimmed, loudness-normalised, mono AAC.
 * The slow version is time-stretched to 0.8x, keeping the pitch.
 */
export function conversionArgs({
  input,
  output,
  startMs,
  endMs,
  slow,
}: {
  input: string;
  output: string;
  startMs: number;
  endMs: number;
  slow: boolean;
}): string[] {
  const filters = ["loudnorm=I=-16:TP=-1.5:LRA=11", ...(slow ? ["atempo=0.8"] : [])].join(",");
  return [
    "-hide_banner", "-y",
    "-ss", seconds(startMs), "-to", seconds(endMs),
    "-i", input,
    "-vn", "-ac", "1", "-ar", "44100",
    "-af", filters,
    "-c:a", "aac", "-b:a", "96k",
    "-movflags", "+faststart",
    output,
  ];
}

/** A trim selection kept inside the clip and never shorter than 200ms. */
export function clampTrim(startMs: number, endMs: number, durationMs: number): { startMs: number; endMs: number } {
  const start = Math.round(Math.min(Math.max(0, startMs), Math.max(0, durationMs - MIN_CLIP_MS)));
  const end = Math.round(Math.min(durationMs, Math.max(endMs, start + MIN_CLIP_MS)));
  return { startMs: start, endMs: end };
}
