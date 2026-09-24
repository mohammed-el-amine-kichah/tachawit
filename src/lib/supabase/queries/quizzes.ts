import { unstable_cache } from "next/cache";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { parseLocalizedText, type LocalizedText } from "@/lib/content/localized-text";
import { collectQuizEntryIds, quizQuestionsSchema, type QuizQuestion } from "@/lib/content/quiz";
import { buildGlossary, toViewEntry, type EntryRow, type Glossary, type ViewEntry } from "@/lib/lesson/view";
import { getSupabaseEnv } from "../env";
import { createPublicClient } from "../public";
import { ENTRY_WITH_AUDIO } from "./entry-select";
import { glossaryCandidates } from "./lessons";

export type QuizView = {
  id: string;
  title: LocalizedText;
  questions: QuizQuestion[];
  entries: Record<string, ViewEntry>;
  glossary: Glossary;
};

async function fetchQuizView(quizId: string): Promise<QuizView | null> {
  const supabase = createPublicClient();
  const { data: quiz, error } = await supabase.from("quizzes").select("id, title, questions").eq("id", quizId).maybeSingle();
  if (error) throw error;
  if (!quiz) return null;

  const questions = quizQuestionsSchema.safeParse(quiz.questions);
  if (!questions.success) {
    console.error(`Quiz ${quizId} has invalid questions`, questions.error.issues);
    return null;
  }

  const entries = await supabase
    .from("entries")
    .select(ENTRY_WITH_AUDIO)
    .in("id", collectQuizEntryIds(questions.data))
    .returns<EntryRow[]>();
  if (entries.error) throw entries.error;

  const words = await supabase
    .from("entries")
    .select(ENTRY_WITH_AUDIO)
    .in("text_latin", glossaryCandidates(entries.data))
    .returns<EntryRow[]>();
  if (words.error) throw words.error;

  const storageUrl = getSupabaseEnv().url;
  return {
    id: quiz.id,
    title: parseLocalizedText(quiz.title),
    questions: questions.data,
    entries: Object.fromEntries(entries.data.map((row) => [row.id, toViewEntry(row, storageUrl)])),
    glossary: buildGlossary([...entries.data, ...words.data], storageUrl),
  };
}

/** A published quiz with every entry it uses, ready for the quiz player. */
export const getQuizView = unstable_cache(fetchQuizView, ["quiz-view"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CONTENT_REVALIDATE_SECONDS,
});
