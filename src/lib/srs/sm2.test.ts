import { describe, expect, it } from "vitest";
import { dueEntryIds, gradeFor, newSrsState, review } from "./sm2";

const now = new Date("2026-09-24T10:00:00Z");
const day = 24 * 60 * 60 * 1000;

describe("newSrsState", () => {
  it("schedules a newly learned word for tomorrow", () => {
    const s = newSrsState(now);
    expect(s).toEqual({ ease: 2.5, intervalDays: 1, repetitions: 0, lapses: 0, dueAt: new Date(now.getTime() + day).toISOString(), lastReviewedAt: null });
  });
});

describe("review", () => {
  it("follows SM-2 intervals for good answers: 1 day, 6 days, then interval × ease", () => {
    let s = newSrsState(now);
    s = review(s, 4, now);
    expect(s.repetitions).toBe(1);
    expect(s.intervalDays).toBe(1);
    s = review(s, 4, now);
    expect(s.intervalDays).toBe(6);
    s = review(s, 4, now);
    expect(s.intervalDays).toBe(15);
    expect(s.dueAt).toBe(new Date(now.getTime() + 15 * day).toISOString());
    expect(s.lastReviewedAt).toBe(now.toISOString());
  });

  it("adjusts ease with answer quality but never below 1.3", () => {
    expect(review(newSrsState(now), 5, now).ease).toBeCloseTo(2.6);
    let s = newSrsState(now);
    for (let i = 0; i < 20; i++) s = review(s, 3, now);
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("starts over after a miss, counting the lapse", () => {
    let s = newSrsState(now);
    s = review(review(review(s, 4, now), 4, now), 4, now);
    s = review(s, 1, now);
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
    expect(s.lapses).toBe(1);
  });
});

describe("gradeFor", () => {
  it("rewards a first-try answer and treats a miss as a lapse", () => {
    expect(gradeFor(true)).toBe(4);
    expect(gradeFor(false)).toBe(1);
  });
});

describe("dueEntryIds", () => {
  it("lists entries due by now, most overdue first, up to a limit", () => {
    const srs = {
      a: { ...newSrsState(now), dueAt: "2026-09-24T09:00:00Z" },
      b: { ...newSrsState(now), dueAt: "2026-09-20T09:00:00Z" },
      c: { ...newSrsState(now), dueAt: "2026-09-25T09:00:00Z" },
    };
    expect(dueEntryIds(srs, now, 10)).toEqual(["b", "a"]);
    expect(dueEntryIds(srs, now, 1)).toEqual(["b"]);
  });
});
