import type { QuizQuestion } from "@/lib/content/quiz";
import type { ViewEntry } from "@/lib/lesson/view";
import { seededRandom, shuffled } from "@/lib/random";

const ROTATION = ["listen_pick_translation", "pick_audio", "speak"] as const;

/**
 * A daily review: one question per due entry, rotating between question types.
 * Distractors come from the other entries in the review pool.
 */
export function buildReviewQuestions(
  dueIds: readonly string[],
  entries: Readonly<Record<string, ViewEntry>>,
  seed: number,
): QuizQuestion[] {
  const random = seededRandom(seed);
  const pool = Object.values(entries);

  return dueIds.flatMap((entryId, index): QuizQuestion[] => {
    const entry = entries[entryId];
    if (!entry) return [];
    const id = `review-${entryId}`;
    const others = shuffled(pool.filter((e) => e.id !== entryId), random);
    const withAudio = others.filter((e) => e.audio);
    const kind = ROTATION[(index + Math.floor(random() * ROTATION.length)) % ROTATION.length];

    if (entry.audio && kind === "listen_pick_translation" && others.length > 0) {
      return [{ id, type: kind, entryId, distractorEntryIds: others.slice(0, 3).map((e) => e.id) }];
    }
    if (entry.audio && kind === "pick_audio" && withAudio.length > 0) {
      return [{ id, type: kind, entryId, distractorEntryIds: withAudio.slice(0, 2).map((e) => e.id) }];
    }
    if (entry.audio && others.length > 0 && kind === "speak") {
      return [{ id, type: "listen_pick_translation", entryId, distractorEntryIds: others.slice(0, 3).map((e) => e.id) }];
    }
    return [{ id, type: "speak", entryId }];
  });
}
