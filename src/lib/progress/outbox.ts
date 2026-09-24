import { safeStorage } from "@/lib/storage";
import { isRecord, readArray, readInt, readNullableString, readNumber, readString } from "./guards";

// Progress writes for signed-in learners wait here until the server confirms them, so a lesson
// finished on a flaky connection (or offline) is never lost. Keyed per user.

type ReviewItem = {
  entry_id: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  last_reviewed_at: string | null;
};

export type OutboxOperation =
  | { kind: "complete_level"; levelId: string; stars: number; xp: number; entryIds: string[]; today: string }
  | { kind: "review"; items: ReviewItem[]; xp: number; today: string };

function readReviewItem(value: unknown): ReviewItem | null {
  if (!isRecord(value)) return null;
  const item = {
    entry_id: readString(value.entry_id),
    ease: readNumber(value.ease),
    interval_days: readInt(value.interval_days),
    repetitions: readInt(value.repetitions),
    lapses: readInt(value.lapses),
    due_at: readString(value.due_at),
  };
  const lastReviewedAt = readNullableString(value.last_reviewed_at);
  if (Object.values(item).some((field) => field === null) || lastReviewedAt === undefined) return null;
  return { ...(item as Omit<ReviewItem, "last_reviewed_at">), last_reviewed_at: lastReviewedAt };
}

function readOperation(value: unknown): OutboxOperation | null {
  if (!isRecord(value)) return null;
  const xp = readInt(value.xp);
  const today = readString(value.today);
  if (xp === null || today === null) return null;
  if (value.kind === "complete_level") {
    const levelId = readString(value.levelId);
    const stars = readInt(value.stars);
    const entryIds = readArray(value.entryIds, readString);
    return levelId === null || stars === null || entryIds === null ? null : { kind: "complete_level", levelId, stars, xp, entryIds, today };
  }
  if (value.kind === "review") {
    const items = readArray(value.items, readReviewItem);
    return items === null ? null : { kind: "review", items, xp, today };
  }
  return null;
}

const key = (userId: string) => `tachawit:outbox:${userId}`;

export function readOutbox(userId: string): OutboxOperation[] {
  const raw = safeStorage.get(key(userId));
  if (!raw) return [];
  try {
    return readArray(JSON.parse(raw), readOperation) ?? [];
  } catch {
    return [];
  }
}

export function writeOutbox(userId: string, operations: OutboxOperation[]): void {
  if (operations.length === 0) safeStorage.remove(key(userId));
  else safeStorage.set(key(userId), JSON.stringify(operations));
}
