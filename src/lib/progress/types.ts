export type LevelStatus = "locked" | "available" | "current" | "completed";

export type LevelState = { status: LevelStatus; stars: number };

export type LevelStates = Record<string, LevelState>;

/** What the unlock rules need to know about a learner's result on a level. */
export type LevelResult = { stars: number; completedAt: string | null };
