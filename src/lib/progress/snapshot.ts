import { newSrsState, review } from "@/lib/srs/sm2";
import { isRecord, readInt, readNullableString, readNumber, readRecord, readString } from "./guards";
import { nextStreak } from "./streak";

// A learner's progress as the app works with it. Guests keep it in localStorage;
// signed-in learners have it loaded from and saved to Supabase.

export type LevelProgress = { stars: number; attempts: number; completedAt: string | null };

export type SrsState = {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
};

export type ProgressSnapshot = {
  version: 1;
  levels: Record<string, LevelProgress>;
  xp: number;
  streak: { current: number; longest: number; lastActiveOn: string | null };
  srs: Record<string, SrsState>;
};

function readLevelProgress(value: unknown): LevelProgress | null {
  if (!isRecord(value)) return null;
  const stars = readInt(value.stars, 0, 3);
  const attempts = readInt(value.attempts, 0);
  const completedAt = readNullableString(value.completedAt);
  return stars === null || attempts === null || completedAt === undefined ? null : { stars, attempts, completedAt };
}

function readSrsState(value: unknown): SrsState | null {
  if (!isRecord(value)) return null;
  const ease = readNumber(value.ease, 1.3);
  const intervalDays = readInt(value.intervalDays, 0);
  const repetitions = readInt(value.repetitions, 0);
  const lapses = readInt(value.lapses, 0);
  const dueAt = readString(value.dueAt);
  const lastReviewedAt = readNullableString(value.lastReviewedAt);
  if (ease === null || intervalDays === null || repetitions === null || lapses === null || dueAt === null || lastReviewedAt === undefined) {
    return null;
  }
  return { ease, intervalDays, repetitions, lapses, dueAt, lastReviewedAt };
}

/** Validates a snapshot read back from storage; null if anything is missing or out of range. */
export function readSnapshot(value: unknown): ProgressSnapshot | null {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.streak)) return null;
  const levels = readRecord(value.levels, readLevelProgress);
  const srs = readRecord(value.srs, readSrsState);
  const xp = readInt(value.xp, 0);
  const current = readInt(value.streak.current, 0);
  const longest = readInt(value.streak.longest, 0);
  const lastActiveOn = readNullableString(value.streak.lastActiveOn);
  if (levels === null || srs === null || xp === null || current === null || longest === null || lastActiveOn === undefined) {
    return null;
  }
  return { version: 1, levels, xp, streak: { current, longest, lastActiveOn }, srs };
}

export function emptySnapshot(): ProgressSnapshot {
  return { version: 1, levels: {}, xp: 0, streak: { current: 0, longest: 0, lastActiveOn: null }, srs: {} };
}

/** Parses stored JSON, falling back to an empty snapshot if it is missing, corrupt or outdated. */
export function parseSnapshot(raw: string | null): ProgressSnapshot {
  if (!raw) return emptySnapshot();
  try {
    return readSnapshot(JSON.parse(raw)) ?? emptySnapshot();
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
