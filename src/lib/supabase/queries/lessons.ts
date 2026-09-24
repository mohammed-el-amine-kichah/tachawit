import { unstable_cache } from "next/cache";
import { normalizeWord, splitWords } from "@/lib/audio/karaoke";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { collectLessonEntryIds, lessonStepsSchema } from "@/lib/content/lesson";
import { parseLocalizedText, type LocalizedText } from "@/lib/content/localized-text";
import { buildGlossary, buildLessonView, type EntryRow, type Glossary, type LessonViewStep } from "@/lib/lesson/view";
import { getSupabaseEnv } from "../env";
import { createPublicClient } from "../public";
import { ENTRY_WITH_AUDIO } from "./entry-select";

export type LessonView = {
  id: string;
  title: LocalizedText;
  steps: LessonViewStep[];
  glossary: Glossary;
};

/** Every spelling a glossary lookup might need for the words of these entries. */
export function glossaryCandidates(entries: readonly EntryRow[]): string[] {
  const words = entries.flatMap((e) => splitWords(e.text_latin)).flatMap((w) => [w, normalizeWord(w)]);
  return [...new Set(words.filter(Boolean))];
}

async function fetchLessonView(lessonId: string): Promise<LessonView | null> {
  const supabase = createPublicClient();
  const { data: lesson, error } = await supabase.from("lessons").select("id, title, steps").eq("id", lessonId).maybeSingle();
  if (error) throw error;
  if (!lesson) return null;

  const steps = lessonStepsSchema.safeParse(lesson.steps);
  if (!steps.success) {
    console.error(`Lesson ${lessonId} has invalid steps`, steps.error.issues);
    return null;
  }

  const noteIds = steps.data.flatMap((s) => (s.type === "culture_note" && s.cultureNoteId ? [s.cultureNoteId] : []));
  const [entries, notes] = await Promise.all([
    supabase.from("entries").select(ENTRY_WITH_AUDIO).in("id", collectLessonEntryIds(steps.data)).returns<EntryRow[]>(),
    noteIds.length
      ? supabase.from("culture_notes").select("id, slug, title, summary, cover_image_path").in("id", noteIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (entries.error) throw entries.error;
  if (notes.error) throw notes.error;

  const words = await supabase
    .from("entries")
    .select(ENTRY_WITH_AUDIO)
    .in("text_latin", glossaryCandidates(entries.data))
    .returns<EntryRow[]>();
  if (words.error) throw words.error;

  const storageUrl = getSupabaseEnv().url;
  return {
    id: lesson.id,
    title: parseLocalizedText(lesson.title),
    steps: buildLessonView({ steps: steps.data, entries: entries.data, cultureNotes: notes.data ?? [], storageUrl }),
    glossary: buildGlossary([...entries.data, ...words.data], storageUrl),
  };
}

/** A published lesson, ready for the player. */
export const getLessonView = unstable_cache(fetchLessonView, ["lesson-view"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CONTENT_REVALIDATE_SECONDS,
});
