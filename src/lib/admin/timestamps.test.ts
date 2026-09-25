import { describe, expect, it } from "vitest";
import { wordTimestampsSchema } from "@/lib/content/word-timestamps";
import { cutsFromTimestamps, MIN_WORD_MS, moveCut, suggestCuts, timestampsFromCuts } from "./timestamps";

const words = ["azul", "fellawen"];

describe("timestampsFromCuts", () => {
  it("turns the cuts around each word into its start and end", () => {
    const result = timestampsFromCuts(words, [50, 700, 1800]);
    expect(result).toEqual([
      { word: "azul", startMs: 50, endMs: 700 },
      { word: "fellawen", startMs: 700, endMs: 1800 },
    ]);
    expect(wordTimestampsSchema.safeParse(result).success).toBe(true);
  });

  it("needs one cut more than there are words, in order and apart", () => {
    expect(timestampsFromCuts(words, [50, 700])).toBeNull();
    expect(timestampsFromCuts(words, [50, 700, 690])).toBeNull();
    expect(timestampsFromCuts(words, [50, 60, 1800])).toBeNull();
    expect(timestampsFromCuts([], [0])).toBeNull();
  });
});

describe("cutsFromTimestamps", () => {
  it("round-trips saved timings", () => {
    const cuts = [50, 700, 1800];
    expect(cutsFromTimestamps(words, timestampsFromCuts(words, cuts), 1880)).toEqual(cuts);
  });

  it("ends an open last word at the end of the recording, and ignores timings for other words", () => {
    expect(cutsFromTimestamps(["azul"], [{ word: "azul", startMs: 50 }], 900)).toEqual([50, 900]);
    expect(cutsFromTimestamps(words, [{ word: "azul", startMs: 50 }], 900)).toBeNull();
    expect(cutsFromTimestamps(words, null, 900)).toBeNull();
  });
});

describe("suggestCuts", () => {
  // Silence, "azul", a pause, "fellawen", silence: 20 bars over 2000 ms.
  const peaks = [0, 0, 0.8, 0.9, 0.7, 0.02, 0.01, 0.6, 0.9, 1, 0.9, 0.8, 0.9, 0.7, 0.8, 0.6, 0, 0, 0, 0];

  it("trims the silence and cuts in the pause between words", () => {
    const cuts = suggestCuts(words, peaks, 2000);
    expect(cuts).toHaveLength(3);
    expect(cuts[0]).toBe(200);
    expect(cuts[2]).toBe(1600);
    expect(cuts[1]).toBeGreaterThanOrEqual(500);
    expect(cuts[1]).toBeLessThan(700);
    expect(timestampsFromCuts(words, cuts)).not.toBeNull();
  });

  it("always gives usable cuts, even for silence or many short words", () => {
    const many = ["a", "b", "c", "d", "e", "f"];
    const cuts = suggestCuts(many, [0, 0, 0], 300);
    expect(cuts).toHaveLength(7);
    expect(cuts.every((c, i) => i === 0 || c - cuts[i - 1] >= MIN_WORD_MS)).toBe(true);
    expect(cuts[cuts.length - 1]).toBeLessThanOrEqual(300);
  });
});

describe("moveCut", () => {
  it("moves a cut but keeps it between its neighbours and inside the recording", () => {
    expect(moveCut([50, 700, 1800], 1, 900, 2000)).toEqual([50, 900, 1800]);
    expect(moveCut([50, 700, 1800], 1, 10, 2000)).toEqual([50, 50 + MIN_WORD_MS, 1800]);
    expect(moveCut([50, 700, 1800], 2, 5000, 2000)).toEqual([50, 700, 2000]);
    expect(moveCut([50, 700, 1800], 0, -20, 2000)).toEqual([0, 700, 1800]);
  });
});
