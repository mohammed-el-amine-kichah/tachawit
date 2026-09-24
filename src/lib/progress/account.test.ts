import { describe, expect, it } from "vitest";
import { snapshotFromRows } from "./account";

describe("snapshotFromRows", () => {
  it("maps database rows into the progress snapshot", () => {
    const snapshot = snapshotFromRows({
      levels: [{ level_id: "L1", stars: 2, attempts: 3, completed_at: "2026-09-24T10:00:00Z" }],
      stats: { xp: 120, current_streak: 4, longest_streak: 9, last_active_on: "2026-09-24" },
      srs: [
        {
          entry_id: "E1",
          ease: 2.36,
          interval_days: 6,
          repetitions: 2,
          lapses: 0,
          due_at: "2026-09-30T10:00:00+00:00",
          last_reviewed_at: "2026-09-24T10:00:00+00:00",
        },
      ],
    });
    expect(snapshot).toEqual({
      version: 1,
      levels: { L1: { stars: 2, attempts: 3, completedAt: "2026-09-24T10:00:00Z" } },
      xp: 120,
      streak: { current: 4, longest: 9, lastActiveOn: "2026-09-24" },
      srs: {
        E1: {
          ease: 2.36,
          intervalDays: 6,
          repetitions: 2,
          lapses: 0,
          dueAt: "2026-09-30T10:00:00+00:00",
          lastReviewedAt: "2026-09-24T10:00:00+00:00",
        },
      },
    });
  });

  it("gives a fresh learner an empty snapshot", () => {
    expect(snapshotFromRows({ levels: [], stats: null, srs: [] }).xp).toBe(0);
  });
});
