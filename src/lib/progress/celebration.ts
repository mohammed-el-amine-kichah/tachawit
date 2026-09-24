import type { LevelStates } from "./types";

export type Celebration = { completed: string[]; unlocked: string[] };

/**
 * What changed since the learner last saw the map: levels newly completed (or improved)
 * and levels that went from locked to open. Drives the stars / path / burst animation.
 */
export function diffLevelStates(before: LevelStates | null, after: LevelStates): Celebration {
  if (!before) return { completed: [], unlocked: [] };
  const completed: string[] = [];
  const unlocked: string[] = [];

  for (const [id, state] of Object.entries(after)) {
    const previous = before[id];
    if (!previous) continue;
    if (state.status === "completed" && (previous.status !== "completed" || state.stars > previous.stars)) {
      completed.push(id);
    }
    if (previous.status === "locked" && (state.status === "available" || state.status === "current")) {
      unlocked.push(id);
    }
  }
  return { completed, unlocked };
}
