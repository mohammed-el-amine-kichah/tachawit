// Short feedback sounds synthesised with Web Audio: no files to download, instant on slow networks.

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, volume: number, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, ctx.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
}

const patterns = {
  /** Bright rising two-note chime. */
  correct: (ctx: AudioContext) => {
    tone(ctx, 659.25, 0, 0.18, 0.18, "triangle");
    tone(ctx, 987.77, 0.1, 0.32, 0.16, "triangle");
  },
  /** Soft, low, never harsh: mistakes are not punished. */
  wrong: (ctx: AudioContext) => {
    tone(ctx, 311.13, 0, 0.22, 0.12, "sine");
    tone(ctx, 261.63, 0.12, 0.3, 0.1, "sine");
  },
  /** A little pentatonic flourish for finishing a level. */
  complete: (ctx: AudioContext) => {
    [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, f, i * 0.09, 0.4, 0.14, "triangle"));
  },
} as const;

export type Sound = keyof typeof patterns;

export function playSound(sound: Sound): void {
  const ctx = audioContext();
  if (ctx) patterns[sound](ctx);
}
