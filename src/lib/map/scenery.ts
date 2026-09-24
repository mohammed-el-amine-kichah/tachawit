export type SceneryItem = {
  /** Index into the theme's list of decor drawings. */
  kind: number;
  side: "left" | "right";
  /** Offset from the top of the region, in px. */
  top: number;
  scale: number;
  /** Nudges the item towards or away from the edge, 0..1. */
  inset: number;
};

/** Stable 32-bit seed from a string (FNV-1a). */
export function seedFrom(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG (mulberry32) so decor looks the same on server and client. */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scatters decor along both edges of a map region, one item per `spacing` px, alternating sides. */
export function placeScenery({
  height,
  seed,
  spacing,
  kinds,
}: {
  height: number;
  seed: number;
  spacing: number;
  kinds: number;
}): SceneryItem[] {
  const next = random(seed);
  const count = Math.max(1, Math.floor(height / spacing));
  const firstSide = next() < 0.5 ? "left" : "right";
  return Array.from({ length: count }, (_, i) => ({
    kind: Math.floor(next() * kinds),
    side: (i % 2 === 0) === (firstSide === "left") ? "left" : "right",
    top: Math.min(height - 1, i * spacing + next() * spacing * 0.6),
    scale: 0.75 + next() * 0.5,
    inset: next(),
  }));
}
