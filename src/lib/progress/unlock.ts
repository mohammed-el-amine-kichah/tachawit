import type { UnlockRule } from "@/lib/content/unlock-rule";
import type { LevelResult, LevelStates } from "./types";

export type UnlockLevel = { id: string; unlockRule: UnlockRule };
export type UnlockUnit = { id: string; levels: UnlockLevel[] };

function isCompleted(result: LevelResult | undefined): boolean {
  return result?.completedAt != null;
}

/**
 * Status of every level on the map. Levels are walked in journey order (units, then levels);
 * the first open level that is not completed is "current".
 */
export function computeLevelStates(units: readonly UnlockUnit[], results: Readonly<Record<string, LevelResult>>): LevelStates {
  const states: LevelStates = {};
  const onMap = new Set(units.flatMap((unit) => unit.levels.map((level) => level.id)));
  let previousId: string | null = null;
  let currentAssigned = false;

  for (const unit of units) {
    const unitStars = unit.levels.reduce((sum, level) => sum + (results[level.id]?.stars ?? 0), 0);

    for (const level of unit.levels) {
      const result = results[level.id];
      const stars = result?.stars ?? 0;

      if (isCompleted(result)) {
        states[level.id] = { status: "completed", stars };
      } else {
        const rule = level.unlockRule;
        const open =
          rule.type === "always" ||
          (rule.type === "previous_completed" && (previousId === null || isCompleted(results[previousId]))) ||
          (rule.type === "levels_completed" &&
            rule.levelIds.filter((id) => onMap.has(id)).every((id) => isCompleted(results[id]))) ||
          (rule.type === "unit_stars" && unitStars - stars >= rule.minStars);

        if (!open) states[level.id] = { status: "locked", stars };
        else if (!currentAssigned) {
          states[level.id] = { status: "current", stars };
          currentAssigned = true;
        } else states[level.id] = { status: "available", stars };
      }
      previousId = level.id;
    }
  }
  return states;
}
