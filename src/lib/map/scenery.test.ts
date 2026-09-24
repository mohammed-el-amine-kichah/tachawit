import { describe, expect, it } from "vitest";
import { placeScenery, seedFrom } from "./scenery";

describe("seedFrom", () => {
  it("is stable for the same text and differs between texts", () => {
    expect(seedFrom("unit-1")).toBe(seedFrom("unit-1"));
    expect(seedFrom("unit-1")).not.toBe(seedFrom("unit-2"));
  });
});

describe("placeScenery", () => {
  const items = placeScenery({ height: 900, seed: seedFrom("u1"), spacing: 150, kinds: 4 });

  it("is deterministic for a given seed", () => {
    expect(placeScenery({ height: 900, seed: seedFrom("u1"), spacing: 150, kinds: 4 })).toEqual(items);
  });

  it("fills the region at roughly the requested spacing, alternating sides", () => {
    expect(items.length).toBe(6);
    items.forEach((item, i) => {
      if (i > 0) expect(item.side).not.toBe(items[i - 1].side);
      expect(item.top).toBeGreaterThanOrEqual(0);
      expect(item.top).toBeLessThan(900);
    });
  });

  it("picks decor kinds and sizes within range", () => {
    for (const item of items) {
      expect(item.kind).toBeGreaterThanOrEqual(0);
      expect(item.kind).toBeLessThan(4);
      expect(item.scale).toBeGreaterThanOrEqual(0.75);
      expect(item.scale).toBeLessThanOrEqual(1.25);
    }
  });
});
