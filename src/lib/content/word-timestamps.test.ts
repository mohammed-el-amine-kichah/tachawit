import { describe, expect, it } from "vitest";
import { wordTimestampsSchema } from "./word-timestamps";

describe("wordTimestampsSchema", () => {
  it("accepts words in chronological order", () => {
    const result = wordTimestampsSchema.safeParse([
      { word: "azul", startMs: 0, endMs: 600 },
      { word: "fellawen", startMs: 650 },
    ]);
    expect(result.success).toBe(true);
  });

  it("accepts an empty list (no karaoke for this clip)", () => {
    expect(wordTimestampsSchema.safeParse([]).success).toBe(true);
  });

  it("rejects words that start before the previous word", () => {
    const result = wordTimestampsSchema.safeParse([
      { word: "azul", startMs: 500 },
      { word: "fellawen", startMs: 400 },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects a word that ends before it starts", () => {
    expect(wordTimestampsSchema.safeParse([{ word: "azul", startMs: 500, endMs: 100 }]).success).toBe(false);
  });

  it("rejects negative times and empty words", () => {
    expect(wordTimestampsSchema.safeParse([{ word: "azul", startMs: -1 }]).success).toBe(false);
    expect(wordTimestampsSchema.safeParse([{ word: "", startMs: 0 }]).success).toBe(false);
  });
});
