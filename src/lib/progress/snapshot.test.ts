import { describe, expect, it } from "vitest";
import { applyLevelCompletion, applyLevelResult, applyReview, emptySnapshot, MAX_XP_PER_ACTIVITY, parseSnapshot } from "./snapshot";

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

describe("applyLevelCompletion", () => {
  it("records the level and adds the XP earned", () => {
    const s = applyLevelCompletion(emptySnapshot(), {
      levelId: "a",
      stars: 3,
      xp: 10,
      entryIds: [],
      completedAt: "2026-09-24T10:00:00Z",
    });
    expect(s.levels.a.stars).toBe(3);
    expect(s.xp).toBe(10);
  });

  it("never adds negative or absurd XP", () => {
    const s = applyLevelCompletion(emptySnapshot(), { levelId: "a", stars: 1, xp: -50, entryIds: [], completedAt: "2026-09-24T10:00:00Z" });
    expect(s.xp).toBe(0);
    const big = applyLevelCompletion(emptySnapshot(), { levelId: "a", stars: 1, xp: 10_000, entryIds: [], completedAt: "2026-09-24T10:00:00Z" });
    expect(big.xp).toBe(MAX_XP_PER_ACTIVITY);
  });
});

describe("applyLevelCompletion: streak and review", () => {
  it("updates the streak for the learner's local day", () => {
    const s = applyLevelCompletion(emptySnapshot(), {
      levelId: "a",
      stars: 3,
      xp: 10,
      entryIds: [],
      completedAt: "2026-09-24T10:00:00Z",
      today: "2026-09-24",
    });
    expect(s.streak).toEqual({ current: 1, longest: 1, lastActiveOn: "2026-09-24" });
  });

  it("adds new entries to review without resetting ones already scheduled", () => {
    let s = applyLevelCompletion(emptySnapshot(), { levelId: "a", stars: 3, xp: 10, entryIds: ["e1"], completedAt: "2026-09-24T10:00:00Z", today: "2026-09-24" });
    const scheduled = s.srs.e1;
    expect(scheduled.dueAt).toBe("2026-09-25T10:00:00.000Z");
    s = applyLevelCompletion(s, { levelId: "b", stars: 3, xp: 10, entryIds: ["e1", "e2"], completedAt: "2026-09-26T10:00:00Z", today: "2026-09-26" });
    expect(s.srs.e1).toBe(scheduled);
    expect(Object.keys(s.srs)).toEqual(["e1", "e2"]);
  });
});

describe("applyReview", () => {
  it("reschedules reviewed entries and counts the day towards the streak", () => {
    let s = applyLevelCompletion(emptySnapshot(), { levelId: "a", stars: 3, xp: 10, entryIds: ["e1"], completedAt: "2026-09-24T10:00:00Z", today: "2026-09-24" });
    s = applyReview(s, { grades: { e1: 4 }, xp: 2, reviewedAt: "2026-09-25T10:00:00Z", today: "2026-09-25" });
    expect(s.srs.e1.repetitions).toBe(1);
    expect(s.xp).toBe(12);
    expect(s.streak.current).toBe(2);
  });
});
