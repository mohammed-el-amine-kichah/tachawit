import type { ProgressSnapshot } from "./snapshot";

export type ProgressRows = {
  levels: { level_id: string; stars: number; attempts: number; completed_at: string | null }[];
  stats: { xp: number; current_streak: number; longest_streak: number; last_active_on: string | null } | null;
  srs: {
    entry_id: string;
    ease: number;
    interval_days: number;
    repetitions: number;
    lapses: number;
    due_at: string;
    last_reviewed_at: string | null;
  }[];
};

/** A signed-in learner's progress, from the database into the same shape guests use. */
export function snapshotFromRows({ levels, stats, srs }: ProgressRows): ProgressSnapshot {
  return {
    version: 1,
    levels: Object.fromEntries(
      levels.map((row) => [row.level_id, { stars: row.stars, attempts: row.attempts, completedAt: row.completed_at }]),
    ),
    xp: stats?.xp ?? 0,
    streak: {
      current: stats?.current_streak ?? 0,
      longest: stats?.longest_streak ?? 0,
      lastActiveOn: stats?.last_active_on ?? null,
    },
    srs: Object.fromEntries(
      srs.map((row) => [
        row.entry_id,
        {
          ease: row.ease,
          intervalDays: row.interval_days,
          repetitions: row.repetitions,
          lapses: row.lapses,
          dueAt: row.due_at,
          lastReviewedAt: row.last_reviewed_at,
        },
      ]),
    ),
  };
}
