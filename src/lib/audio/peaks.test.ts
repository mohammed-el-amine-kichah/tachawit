import { describe, expect, it } from "vitest";
import { computePeaks, placeholderPeaks } from "./peaks";

describe("computePeaks", () => {
  it("returns the loudest sample of each bucket, normalised to the loudest overall", () => {
    const samples = new Float32Array([0.1, -0.5, 0.2, 0.25, 0, -0.05, 0.1, 0.05]);
    expect(computePeaks(samples, 4)).toEqual([1, 0.5, 0.1, 0.2]);
  });

  it("handles silence and more bars than samples", () => {
    expect(computePeaks(new Float32Array(8), 4)).toEqual([0, 0, 0, 0]);
    expect(computePeaks(new Float32Array([0.5]), 3)).toEqual([1, 0, 0]);
  });
});

describe("placeholderPeaks", () => {
  it("is deterministic per key and stays within 0.2..1", () => {
    const a = placeholderPeaks("clip-1", 24);
    expect(a).toEqual(placeholderPeaks("clip-1", 24));
    expect(a).toHaveLength(24);
    a.forEach((p) => {
      expect(p).toBeGreaterThanOrEqual(0.2);
      expect(p).toBeLessThanOrEqual(1);
    });
  });
});
