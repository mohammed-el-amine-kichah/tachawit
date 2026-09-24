import { describe, expect, it } from "vitest";
import { diffLevelStates } from "./celebration";

describe("diffLevelStates", () => {
  it("has nothing to celebrate on a first visit", () => {
    expect(diffLevelStates(null, { a: { status: "current", stars: 0 } })).toEqual({ completed: [], unlocked: [] });
  });

  it("reports levels that became completed and levels that opened up", () => {
    const before = { a: { status: "current", stars: 0 }, b: { status: "locked", stars: 0 } } as const;
    const after = { a: { status: "completed", stars: 3 }, b: { status: "current", stars: 0 } } as const;
    expect(diffLevelStates(before, after)).toEqual({ completed: ["a"], unlocked: ["b"] });
  });

  it("reports extra stars on an already completed level as a completion", () => {
    const before = { a: { status: "completed", stars: 1 } } as const;
    const after = { a: { status: "completed", stars: 3 } } as const;
    expect(diffLevelStates(before, after).completed).toEqual(["a"]);
  });

  it("does not treat a level that was merely moved from available to current as unlocked", () => {
    const before = { a: { status: "available", stars: 0 } } as const;
    const after = { a: { status: "current", stars: 0 } } as const;
    expect(diffLevelStates(before, after)).toEqual({ completed: [], unlocked: [] });
  });

  it("ignores levels that were not on the map before (newly published content)", () => {
    const before = { a: { status: "completed", stars: 3 } } as const;
    const after = { a: { status: "completed", stars: 3 }, z: { status: "current", stars: 0 } } as const;
    expect(diffLevelStates(before, after).unlocked).toEqual([]);
  });
});
