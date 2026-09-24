import { describe, expect, it } from "vitest";
import { pathSegments, smoothPath } from "./path";

const points = [
  { x: 200, y: 50 },
  { x: 100, y: 200 },
  { x: 300, y: 350 },
  { x: 200, y: 500 },
];

function endPoint(d: string) {
  const numbers = d.trim().split(/[\s,MC]+/).filter(Boolean).map(Number);
  return { x: numbers.at(-2), y: numbers.at(-1) };
}

describe("smoothPath", () => {
  it("is empty without points and a bare move with one point", () => {
    expect(smoothPath([])).toBe("");
    expect(smoothPath([{ x: 1, y: 2 }])).toBe("M1 2");
  });

  it("starts at the first point and uses one cubic curve per gap", () => {
    const d = smoothPath(points);
    expect(d.startsWith("M200 50")).toBe(true);
    expect(d.match(/C/g)).toHaveLength(3);
    expect(endPoint(d)).toEqual({ x: 200, y: 500 });
  });
});

describe("pathSegments", () => {
  it("returns one self-contained segment per pair of consecutive points", () => {
    const segments = pathSegments(points);
    expect(segments).toHaveLength(3);
    segments.forEach((d, i) => {
      expect(d.startsWith(`M${points[i].x} ${points[i].y}`)).toBe(true);
      expect(endPoint(d)).toEqual(points[i + 1]);
    });
  });

  it("has no segments for fewer than two points", () => {
    expect(pathSegments([{ x: 0, y: 0 }])).toEqual([]);
  });
});
