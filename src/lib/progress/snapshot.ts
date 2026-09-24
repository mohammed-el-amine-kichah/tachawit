import { z } from "zod";

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
