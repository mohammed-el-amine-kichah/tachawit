// Checks on a recording before it is sent, so a speaker can redo it right away.

export type RecordingIssue = "too_short" | "silent" | "too_loud";

/** Recordings stop on their own after this long. */
export const MAX_RECORDING_SECONDS = 30;
/** From here the timer warns that the recording is about to stop. */
export const WARN_RECORDING_SECONDS = 25;

const MIN_SECONDS = 0.4;
const SILENT_PEAK = 0.02;
const CLIPPED = 0.99;
const MAX_CLIPPED_SHARE = 0.001;

export function checkRecording(samples: Float32Array, sampleRate: number): RecordingIssue | null {
  if (samples.length / sampleRate < MIN_SECONDS) return "too_short";
  let peak = 0;
  let clipped = 0;
  for (const sample of samples) {
    const level = Math.abs(sample);
    if (level > peak) peak = level;
    if (level >= CLIPPED) clipped++;
  }
  if (peak < SILENT_PEAK) return "silent";
  if (clipped / samples.length > MAX_CLIPPED_SHARE) return "too_loud";
  return null;
}
