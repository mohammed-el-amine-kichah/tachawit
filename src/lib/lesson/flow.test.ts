import { describe, expect, it } from "vitest";
import { initialFlow, lessonFlow } from "./flow";

describe("lessonFlow", () => {
  it("starts on the first step, moving forwards", () => {
    expect(initialFlow).toEqual({ index: 0, direction: 1, finished: false });
  });

  it("advances and finishes after the last step", () => {
    let s = lessonFlow(initialFlow, { type: "next", total: 2 });
    expect(s).toEqual({ index: 1, direction: 1, finished: false });
    s = lessonFlow(s, { type: "next", total: 2 });
    expect(s).toEqual({ index: 1, direction: 1, finished: true });
  });

  it("goes back but never before the first step", () => {
    const s = lessonFlow({ index: 1, direction: 1, finished: false }, { type: "back" });
    expect(s).toEqual({ index: 0, direction: -1, finished: false });
    expect(lessonFlow(s, { type: "back" })).toEqual(s);
  });
});
