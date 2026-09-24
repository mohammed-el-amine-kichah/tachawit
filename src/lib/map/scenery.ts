import { seededRandom } from "@/lib/random";

export { seedFrom } from "@/lib/random";

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
  const next = seededRandom(seed);
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
