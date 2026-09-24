import { z } from "zod";
import { newSrsState, review } from "@/lib/srs/sm2";
import { nextStreak } from "./streak";

// A learner's progress as the app works with it. Guests keep it in localStorage;
// signed-in learners have it loaded from and saved to Supabase.

const levelProgressSchema = z.object({
  stars: z.int().min(0).max(3),
  attempts: z.int().nonnegative(),
  completedAt: z.string().nullable(),
});

const srsStateSchema = z.object({
  ease: z.number().min(1.3),
  intervalDays: z.int().nonnegative(),
  repetitions: z.int().nonnegative(),
  lapses: z.int().nonnegative(),
  dueAt: z.string(),
  lastReviewedAt: z.string().nullable(),
});

export const snapshotSchema = z.object({
  version: z.literal(1),
  levels: z.record(z.string(), levelProgressSchema),
  xp: z.int().nonnegative(),
  streak: z.object({
    current: z.int().nonnegative(),
    longest: z.int().nonnegative(),
    lastActiveOn: z.string().nullable(),
  }),
  srs: z.record(z.string(), srsStateSchema),
});

export type ProgressSnapshot = z.infer<typeof snapshotSchema>;
export type LevelProgress = z.infer<typeof levelProgressSchema>;
export type SrsState = z.infer<typeof srsStateSchema>;

export function emptySnapshot(): ProgressSnapshot {
  return { version: 1, levels: {}, xp: 0, streak: { current: 0, longest: 0, lastActiveOn: null }, srs: {} };
}

/** Parses stored JSON, falling back to an empty snapshot if it is missing, corrupt or outdated. */
export function parseSnapshot(raw: string | null): ProgressSnapshot {
  if (!raw) return emptySnapshot();
  try {
    const parsed = snapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptySnapshot();
  } catch {
    return emptySnapshot();
  }
}

export type LevelResultInput = { levelId: string; stars: number; completedAt: string };

/** Records a finished level: best stars win, the first completion date is kept. */
export function applyLevelResult(snapshot: ProgressSnapshot, input: LevelResultInput): ProgressSnapshot {
  const previous = snapshot.levels[input.levelId];
  const stars = Math.min(3, Math.max(0, Math.round(input.stars)));
  return {
    ...snapshot,
    levels: {
      ...snapshot.levels,
      [input.levelId]: {
        stars: Math.max(stars, previous?.stars ?? 0),
        attempts: (previous?.attempts ?? 0) + 1,
        completedAt: previous?.completedAt ?? input.completedAt,
      },
    },
  };
}

/** Upper bound on XP a single lesson, quiz or review can award. */
export const MAX_XP_PER_ACTIVITY = 100;

export type LevelCompletion = {
  levelId: string;
  stars: number;
  xp: number;
  /** Entries practised in the level; they join spaced-repetition review. */
  entryIds: string[];
  completedAt: string;
  /** The learner's local calendar date (YYYY-MM-DD), for the streak. Defaults to completedAt's date. */
  today?: string;
};

export function clampXp(xp: number): number {
  return Math.min(MAX_XP_PER_ACTIVITY, Math.max(0, Math.round(xp)));
}

/** A finished level: best stars, XP earned, streak, and new words scheduled for review. */
export function applyLevelCompletion(snapshot: ProgressSnapshot, completion: LevelCompletion): ProgressSnapshot {
  const next = applyLevelResult(snapshot, completion);
  const now = new Date(completion.completedAt);
  const srs = { ...next.srs };
  for (const entryId of completion.entryIds) srs[entryId] ??= newSrsState(now);
  return {
    ...next,
    xp: next.xp + clampXp(completion.xp),
    streak: nextStreak(next.streak, completion.today ?? completion.completedAt.slice(0, 10)),
    srs,
  };
}

export type ReviewResult = {
  /** SM-2 answer quality per reviewed entry. */
  grades: Record<string, number>;
  xp: number;
  reviewedAt: string;
  today: string;
};

/** A finished review session: reschedule each entry, add XP, keep the streak going. */
export function applyReview(snapshot: ProgressSnapshot, result: ReviewResult): ProgressSnapshot {
  const now = new Date(result.reviewedAt);
  const srs = { ...snapshot.srs };
  for (const [entryId, grade] of Object.entries(result.grades)) {
    srs[entryId] = review(srs[entryId] ?? newSrsState(now), grade, now);
  }
  return {
    ...snapshot,
    srs,
    xp: snapshot.xp + clampXp(result.xp),
    streak: nextStreak(snapshot.streak, result.today),
  };
}
