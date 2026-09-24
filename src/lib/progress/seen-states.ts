import { safeStorage } from "@/lib/storage";
import { isRecord, readInt, readRecord } from "./guards";
import type { LevelState, LevelStates } from "./types";

// The level states the learner last saw on the map, to animate what changed since.

const SEEN_KEY = "tachawit:map-seen";

const STATUSES = new Set(["locked", "available", "current", "completed"]);

function readSeen(value: unknown): LevelState | null {
  if (!isRecord(value) || !STATUSES.has(value.status as string)) return null;
  const stars = readInt(value.stars, 0, 3);
  return stars === null ? null : { status: value.status as LevelState["status"], stars };
}

export function readSeenStates(): LevelStates | null {
  const raw = safeStorage.get(SEEN_KEY);
  if (!raw) return null;
  try {
    return readRecord(JSON.parse(raw), readSeen);
  } catch {
    return null;
  }
}

export function writeSeenStates(states: LevelStates): void {
  safeStorage.set(SEEN_KEY, JSON.stringify(states));
}
