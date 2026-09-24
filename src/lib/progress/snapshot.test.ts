import { describe, expect, it } from "vitest";
import { applyLevelResult, emptySnapshot, parseSnapshot } from "./snapshot";

describe("applyLevelResult", () => {
  it("records a first completion", () => {
    const next = applyLevelResult(emptySnapshot(), { levelId: "a", stars: 2, completedAt: "2026-09-24T10:00:00Z" });
    expect(next.levels.a).toEqual({ stars: 2, attempts: 1, completedAt: "2026-09-24T10:00:00Z" });
  });

  it("keeps the best stars and the first completion date on replays", () => {
    let s = applyLevelResult(emptySnapshot(), { levelId: "a", stars: 3, completedAt: "2026-09-24T10:00:00Z" });
    s = applyLevelResult(s, { levelId: "a", stars: 1, completedAt: "2026-09-25T10:00:00Z" });
    expect(s.levels.a).toEqual({ stars: 3, attempts: 2, completedAt: "2026-09-24T10:00:00Z" });
  });

  it("does not mutate the previous snapshot", () => {
    const before = emptySnapshot();
    applyLevelResult(before, { levelId: "a", stars: 1, completedAt: "2026-09-24T10:00:00Z" });
    expect(before.levels).toEqual({});
  });

  it("clamps stars to 0..3", () => {
    const s = applyLevelResult(emptySnapshot(), { levelId: "a", stars: 7, completedAt: "2026-09-24T10:00:00Z" });
    expect(s.levels.a.stars).toBe(3);
  });
});

describe("parseSnapshot", () => {
  it("returns an empty snapshot for missing or corrupt data", () => {
    expect(parseSnapshot(null)).toEqual(emptySnapshot());
    expect(parseSnapshot("{not json")).toEqual(emptySnapshot());
    expect(parseSnapshot(JSON.stringify({ version: 99 }))).toEqual(emptySnapshot());
  });

  it("round-trips a valid snapshot", () => {
    const s = applyLevelResult(emptySnapshot(), { levelId: "a", stars: 2, completedAt: "2026-09-24T10:00:00Z" });
    expect(parseSnapshot(JSON.stringify(s))).toEqual(s);
  });
});
