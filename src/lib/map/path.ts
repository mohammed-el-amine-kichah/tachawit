import type { Point } from "./layout";

const round = (n: number) => Math.round(n * 100) / 100;
const pt = (p: Point) => `${round(p.x)} ${round(p.y)}`;

/** Cubic Bézier control points for the curve from points[i] to points[i + 1] (Catmull-Rom, tension 0.5). */
function controlPoints(points: readonly Point[], i: number): [Point, Point] {
  const p0 = points[i - 1] ?? points[i];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[i + 2] ?? p2;
  return [
    { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
    { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
  ];
}

/** A smooth winding path through all points, as an SVG path string. */
export function smoothPath(points: readonly Point[]): string {
  if (points.length === 0) return "";
  let d = `M${pt(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [c1, c2] = controlPoints(points, i);
    d += ` C${pt(c1)}, ${pt(c2)}, ${pt(points[i + 1])}`;
  }
  return d;
}

/** The same path split into one drawable segment per pair of neighbours, for per-segment styling. */
export function pathSegments(points: readonly Point[]): string[] {
  const segments: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [c1, c2] = controlPoints(points, i);
    segments.push(`M${pt(points[i])} C${pt(c1)}, ${pt(c2)}, ${pt(points[i + 1])}`);
  }
  return segments;
}
