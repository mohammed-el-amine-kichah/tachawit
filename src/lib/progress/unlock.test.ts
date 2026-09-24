import { describe, expect, it } from "vitest";
import type { UnlockRule } from "@/lib/content/unlock-rule";
import { computeLevelStates, type UnlockUnit } from "./unlock";

type LevelType = "lesson" | "quiz" | "review" | "boss" | "story";
const level = (id: string, type: LevelType = "lesson", unlockRule: UnlockRule = { type: "previous_completed" }) => ({
  id,
  type,
  unlockRule,
});

const units: UnlockUnit[] = [
  { id: "u1", levels: [level("a"), level("b"), level("c", "quiz")] },
  { id: "u2", levels: [level("d"), level("e", "review")] },
];

const done = (stars: number) => ({ stars, completedAt: "2026-09-24T10:00:00Z" });

describe("computeLevelStates", () => {
  it("makes the very first level current and locks the rest when nothing is done", () => {
    const states = computeLevelStates(units, {});
    expect(states.a).toEqual({ status: "current", stars: 0 });
    expect(states.b.status).toBe("locked");
    expect(states.c.status).toBe("locked");
    expect(states.d.status).toBe("locked");
  });

  it("unlocks the next level once the previous one is completed, keeping stars", () => {
    const states = computeLevelStates(units, { a: done(3) });
    expect(states.a).toEqual({ status: "completed", stars: 3 });
    expect(states.b.status).toBe("current");
    expect(states.c.status).toBe("locked");
  });

  it("chains across units: the first level of a unit follows the last level of the previous one", () => {
    const states = computeLevelStates(units, { a: done(2), b: done(1), c: done(3) });
    expect(states.d.status).toBe("current");
    expect(states.e.status).toBe("locked");
  });

  it("marks only the first open level as current; other open ones are available", () => {
    const withAlways: UnlockUnit[] = [{ id: "u1", levels: [level("a"), level("b"), level("x", "story", { type: "always" })] }];
    const states = computeLevelStates(withAlways, {});
    expect(states.a.status).toBe("current");
    expect(states.x.status).toBe("available");
  });

  it("supports levels_completed rules and ignores levels that are not on the map", () => {
    const custom: UnlockUnit[] = [
      {
        id: "u1",
        levels: [
          level("a"),
          level("b", "lesson", { type: "always" }),
          level("boss", "boss", { type: "levels_completed", levelIds: ["a", "b", "not-published"] }),
        ],
      },
    ];
    expect(computeLevelStates(custom, { a: done(3) }).boss.status).toBe("locked");
    expect(computeLevelStates(custom, { a: done(3), b: done(1) }).boss.status).toBe("current");
  });

  it("supports unit_stars rules counting stars earned in the same unit", () => {
    const custom: UnlockUnit[] = [
      { id: "u1", levels: [level("a"), level("b", "lesson", { type: "always" }), level("boss", "boss", { type: "unit_stars", minStars: 5 })] },
    ];
    expect(computeLevelStates(custom, { a: done(3), b: done(1) }).boss.status).toBe("locked");
    expect(computeLevelStates(custom, { a: done(3), b: done(2) }).boss.status).toBe("current");
  });

  it("keeps completed levels completed even if their rule is no longer met", () => {
    const states = computeLevelStates(units, { c: done(2) });
    expect(states.c).toEqual({ status: "completed", stars: 2 });
  });

  it("returns an empty object for an empty map", () => {
    expect(computeLevelStates([], {})).toEqual({});
  });
});
