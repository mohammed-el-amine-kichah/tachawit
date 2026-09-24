import { seedFrom, seededRandom } from "@/lib/random";

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Loudest sample per bar, normalised so the loudest bar is 1. */
export function computePeaks(samples: Float32Array, bars: number): number[] {
  const size = Math.max(1, Math.ceil(samples.length / bars));
  const peaks = Array.from({ length: bars }, (_, i) => {
    let peak = 0;
    for (let j = i * size; j < Math.min((i + 1) * size, samples.length); j++) peak = Math.max(peak, Math.abs(samples[j]));
    return peak;
  });
  const max = Math.max(...peaks);
  return max === 0 ? peaks.map(() => 0) : peaks.map((p) => round(p / max));
}

/** A plausible-looking waveform shown while the real one is decoded. */
export function placeholderPeaks(key: string, bars: number): number[] {
  const random = seededRandom(seedFrom(key));
  return Array.from({ length: bars }, (_, i) => {
    const envelope = Math.sin((Math.PI * (i + 0.5)) / bars);
    return round(Math.min(1, Math.max(0.2, envelope * (0.55 + random() * 0.45))));
  });
}
