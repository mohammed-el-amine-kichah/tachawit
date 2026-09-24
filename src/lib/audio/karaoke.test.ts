import { describe, expect, it } from "vitest";
import { activeWordIndex, alignTimestamps, normalizeWord, scaleTimestamps, splitWords, wordSegment } from "./karaoke";

const words = [
  { word: "azul", startMs: 50, endMs: 650 },
  { word: "fellawen", startMs: 810, endMs: 1730 },
];

describe("splitWords", () => {
  it("splits on any whitespace and drops empties", () => {
    expect(splitWords("  azul   fellawen\n")).toEqual(["azul", "fellawen"]);
    expect(splitWords("أزول فلاون")).toEqual(["أزول", "فلاون"]);
    expect(splitWords("")).toEqual([]);
  });
});

describe("normalizeWord", () => {
  it("lowercases and strips surrounding punctuation in any script", () => {
    expect(normalizeWord("Azul!")).toBe("azul");
    expect(normalizeWord("«aɣrum»,")).toBe("aɣrum");
    expect(normalizeWord("أزول؟")).toBe("أزول");
  });
});

describe("activeWordIndex", () => {
  it("highlights the word being spoken", () => {
    expect(activeWordIndex(words, 0)).toBe(-1);
    expect(activeWordIndex(words, 50)).toBe(0);
    expect(activeWordIndex(words, 900)).toBe(1);
  });

  it("clears the highlight in the gap after a word's end", () => {
    expect(activeWordIndex(words, 700)).toBe(-1);
    expect(activeWordIndex(words, 1800)).toBe(-1);
  });

  it("keeps a word without an end highlighted until the next one starts", () => {
    const open = [{ word: "a", startMs: 0 }, { word: "b", startMs: 500 }];
    expect(activeWordIndex(open, 400)).toBe(0);
    expect(activeWordIndex(open, 9999)).toBe(1);
  });
});

describe("wordSegment", () => {
  it("uses the word's own end when present", () => {
    expect(wordSegment(words, 0, 1880)).toEqual({ startMs: 50, endMs: 650 });
  });

  it("falls back to the next word's start, then the clip's end", () => {
    const open = [{ word: "a", startMs: 0 }, { word: "b", startMs: 500 }];
    expect(wordSegment(open, 0, 1200)).toEqual({ startMs: 0, endMs: 500 });
    expect(wordSegment(open, 1, 1200)).toEqual({ startMs: 500, endMs: 1200 });
  });
});

describe("alignTimestamps", () => {
  it("returns the timings when every displayed word has one", () => {
    expect(alignTimestamps(words, ["ⴰⵣⵓⵍ", "ⴼⴻⵍⵍⴰⵡⴻⵏ"])).toBe(words);
  });

  it("returns null when the word counts differ (no highlighting rather than wrong highlighting)", () => {
    expect(alignTimestamps(words, ["azulfellawen"])).toBeNull();
    expect(alignTimestamps(null, ["azul"])).toBeNull();
  });
});

describe("scaleTimestamps", () => {
  it("stretches timings for a slowed-down recording", () => {
    expect(scaleTimestamps(words, 2)).toEqual([
      { word: "azul", startMs: 100, endMs: 1300 },
      { word: "fellawen", startMs: 1620, endMs: 3460 },
    ]);
  });
});
