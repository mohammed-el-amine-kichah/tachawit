import { describe, expect, it } from "vitest";
import { autoArrange, blankQuestion, blankStep, itemIssues, moveItem, nextId, nextNodePosition } from "./builder";

const E = "30000000-0000-4000-8000-000000000001";
const F = "30000000-0000-4000-8000-000000000002";

describe("moveItem", () => {
  it("moves an item and leaves the original list untouched", () => {
    const list = ["a", "b", "c", "d"];
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(list).toEqual(["a", "b", "c", "d"]);
  });

  it("ignores moves out of range", () => {
    expect(moveItem(["a", "b"], 0, 5)).toEqual(["a", "b"]);
  });
});

describe("nextId", () => {
  it("creates short ids that do not clash with existing ones", () => {
    expect(nextId([], "s")).toBe("s1");
    expect(nextId([{ id: "s1" }, { id: "s4" }, { id: "greet-2" }], "s")).toBe("s5");
  });
});

describe("blank items and their issues", () => {
  it("starts every step type empty, with what is missing reported", () => {
    expect(itemIssues("lesson", [blankStep("introduce", "s1")])).toEqual({ s1: "entry" });
    expect(itemIssues("lesson", [blankStep("dialogue", "s2")])).toEqual({ s2: "lines" });
    expect(itemIssues("lesson", [blankStep("culture_note", "s3")])).toEqual({ s3: "body" });
  });

  it("reports nothing for complete steps", () => {
    expect(itemIssues("lesson", [{ ...blankStep("introduce", "s1"), entryId: E }])).toEqual({});
  });

  it("starts every question type empty, with what is missing reported", () => {
    expect(itemIssues("quiz", [blankQuestion("listen_pick_translation", "q1")])).toEqual({ q1: "entry" });
    expect(itemIssues("quiz", [{ ...blankQuestion("pick_audio", "q1"), entryId: E }])).toEqual({ q1: "distractors" });
    expect(itemIssues("quiz", [blankQuestion("match_pairs", "q2")])).toEqual({ q2: "pairs" });
    expect(itemIssues("quiz", [{ ...blankQuestion("speak", "q3"), entryId: E }])).toEqual({});
    expect(itemIssues("quiz", [{ ...blankQuestion("match_pairs", "q4"), entryIds: [E, F] }])).toEqual({});
  });
});

describe("map node placement", () => {
  it("places a new node at the bottom, on the other side from the last one", () => {
    expect(nextNodePosition([])).toEqual({ x: 0.5, y: 0.1 });
    expect(nextNodePosition([{ x: 0.3, y: 0.2 }])).toEqual({ x: 0.7, y: 0.9 });
    expect(nextNodePosition([{ x: 0.8, y: 0.2 }])).toEqual({ x: 0.3, y: 0.9 });
  });

  it("auto-arranges nodes in an even winding path", () => {
    expect(autoArrange(3)).toEqual([
      { x: 0.5, y: 0.1 },
      { x: 0.25, y: 0.5 },
      { x: 0.75, y: 0.9 },
    ]);
    expect(autoArrange(1)).toEqual([{ x: 0.5, y: 0.5 }]);
  });
});
