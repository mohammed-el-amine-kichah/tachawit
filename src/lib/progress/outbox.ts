import { z } from "zod";
import { safeStorage } from "@/lib/storage";

// Progress writes for signed-in learners wait here until the server confirms them, so a lesson
// finished on a flaky connection (or offline) is never lost. Keyed per user.

const operationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("complete_level"),
    levelId: z.string(),
    stars: z.int(),
    xp: z.int(),
    entryIds: z.array(z.string()),
    today: z.string(),
  }),
  z.object({
    kind: z.literal("review"),
    items: z.array(
      z.object({
        entry_id: z.string(),
        ease: z.number(),
        interval_days: z.int(),
        repetitions: z.int(),
        lapses: z.int(),
        due_at: z.string(),
        last_reviewed_at: z.string().nullable(),
      }),
    ),
    xp: z.int(),
    today: z.string(),
  }),
]);

export type OutboxOperation = z.infer<typeof operationSchema>;

const key = (userId: string) => `tachawit:outbox:${userId}`;

export function readOutbox(userId: string): OutboxOperation[] {
  const raw = safeStorage.get(key(userId));
  if (!raw) return [];
  try {
    const parsed = z.array(operationSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function writeOutbox(userId: string, operations: OutboxOperation[]): void {
  if (operations.length === 0) safeStorage.remove(key(userId));
  else safeStorage.set(key(userId), JSON.stringify(operations));
}
