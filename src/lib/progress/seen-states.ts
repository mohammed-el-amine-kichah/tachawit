import { z } from "zod";
import { safeStorage } from "@/lib/storage";
import type { LevelStates } from "./types";

// The level states the learner last saw on the map, to animate what changed since.

const SEEN_KEY = "tachawit:map-seen";

const seenSchema = z.record(
  z.string(),
  z.object({ status: z.enum(["locked", "available", "current", "completed"]), stars: z.int().min(0).max(3) }),
);

export function readSeenStates(): LevelStates | null {
  const raw = safeStorage.get(SEEN_KEY);
  if (!raw) return null;
  try {
    const parsed = seenSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeSeenStates(states: LevelStates): void {
  safeStorage.set(SEEN_KEY, JSON.stringify(states));
}
