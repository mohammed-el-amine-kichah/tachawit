import { unstable_cache } from "next/cache";
import { z } from "zod";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { parseLocalizedText, type LocalizedText } from "@/lib/content/localized-text";
import { createPublicClient } from "../public";
import type { LevelType } from "./units";

export type LevelInfo = {
  id: string;
  type: LevelType;
  title: LocalizedText | null;
  unitTitle: LocalizedText;
  lessonId: string | null;
  quizId: string | null;
};

async function fetchLevel(levelId: string): Promise<LevelInfo | null> {
  if (!z.uuid().safeParse(levelId).success) return null;
  const { data, error } = await createPublicClient()
    .from("levels")
    .select("id, type, title, lesson_id, quiz_id, units(title)")
    .eq("id", levelId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.units) return null;
  return {
    id: data.id,
    type: data.type,
    title: data.title === null ? null : parseLocalizedText(data.title),
    unitTitle: parseLocalizedText(data.units.title),
    lessonId: data.lesson_id,
    quizId: data.quiz_id,
  };
}

/** A published level of a published unit, or null. */
export const getLevel = unstable_cache(fetchLevel, ["level"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CONTENT_REVALIDATE_SECONDS,
});
