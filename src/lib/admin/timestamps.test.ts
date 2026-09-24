import { describe, expect, it } from "vitest";
import { wordTimestampsSchema } from "@/lib/content/word-timestamps";
import { timestampsFromTaps } from "./timestamps";

describe("timestampsFromTaps", () => {
  it("turns taps at each word's start into timings that end just before the next word", () => {
    const result = timestampsFromTaps(["azul", "fellawen"], [50, 810], 1880);
    expect(result).toEqual([
      { word: "azul", startMs: 50, endMs: 790 },
      { word: "fellawen", startMs: 810, endMs: 1880 },
    ]);
    expect(wordTimestampsSchema.safeParse(result).success).toBe(true);
  });

  it("uses an extra final tap as the end of the last word", () => {
    expect(timestampsFromTaps(["azul"], [50, 650], 1880)).toEqual([{ word: "azul", startMs: 50, endMs: 650 }]);
  });

  it("returns null until every word has been tapped, or if taps go backwards", () => {
    expect(timestampsFromTaps(["azul", "fellawen"], [50], 1880)).toBeNull();
    expect(timestampsFromTaps(["azul", "fellawen"], [800, 50], 1880)).toBeNull();
  });
});
