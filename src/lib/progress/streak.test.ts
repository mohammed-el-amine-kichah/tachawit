import { describe, expect, it } from "vitest";
import { displayStreak, localDate, nextStreak } from "./streak";

const start = { current: 0, longest: 0, lastActiveOn: null };

describe("nextStreak", () => {
  it("starts at 1 on the first active day", () => {
    expect(nextStreak(start, "2026-09-24")).toEqual({ current: 1, longest: 1, lastActiveOn: "2026-09-24" });
  });

  it("does not change on a second activity the same day", () => {
    const s = { current: 3, longest: 5, lastActiveOn: "2026-09-24" };
    expect(nextStreak(s, "2026-09-24")).toEqual(s);
  });

  it("grows by one on the next day and tracks the longest streak", () => {
    expect(nextStreak({ current: 5, longest: 5, lastActiveOn: "2026-09-23" }, "2026-09-24")).toEqual({
      current: 6,
      longest: 6,
      lastActiveOn: "2026-09-24",
    });
  });

  it("restarts at 1 after a missed day, keeping the longest", () => {
    expect(nextStreak({ current: 9, longest: 12, lastActiveOn: "2026-09-20" }, "2026-09-24")).toEqual({
      current: 1,
      longest: 12,
      lastActiveOn: "2026-09-24",
    });
  });

  it("handles month and year boundaries", () => {
    expect(nextStreak({ current: 1, longest: 1, lastActiveOn: "2026-12-31" }, "2027-01-01").current).toBe(2);
    expect(nextStreak({ current: 1, longest: 1, lastActiveOn: "2028-02-28" }, "2028-02-29").current).toBe(2);
  });

  it("ignores a date earlier than the last activity (clock changes)", () => {
    const s = { current: 2, longest: 2, lastActiveOn: "2026-09-24" };
    expect(nextStreak(s, "2026-09-22")).toEqual(s);
  });
});

describe("displayStreak", () => {
  it("shows the streak while it is alive (active today or yesterday)", () => {
    expect(displayStreak({ current: 4, longest: 4, lastActiveOn: "2026-09-24" }, "2026-09-24")).toBe(4);
    expect(displayStreak({ current: 4, longest: 4, lastActiveOn: "2026-09-23" }, "2026-09-24")).toBe(4);
  });

  it("shows 0 once a day has been missed", () => {
    expect(displayStreak({ current: 4, longest: 4, lastActiveOn: "2026-09-21" }, "2026-09-24")).toBe(0);
    expect(displayStreak(start, "2026-09-24")).toBe(0);
  });
});

describe("localDate", () => {
  it("formats the learner's calendar date, not the UTC one", () => {
    expect(localDate(new Date(2026, 8, 4, 23, 30))).toBe("2026-09-04");
  });
});
