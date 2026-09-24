import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { PreviewQuiz } from "@/components/quiz/preview-quiz";
import { Notice } from "@/components/shared/notice";
import { Button } from "@/components/ui/button";
import { getPathname, Link } from "@/i18n/navigation";
import { AdminAccessError, requireAdmin } from "@/lib/admin/guard";
import { getContent, listCultureNoteOptions } from "@/lib/admin/queries";
import { collectLessonEntryIds, lessonStepsSchema } from "@/lib/content/lesson";
import { parseLocalizedText } from "@/lib/content/localized-text";
import { collectQuizEntryIds, quizQuestionsSchema } from "@/lib/content/quiz";
import { buildGlossary, buildLessonView, toViewEntry, type EntryRow } from "@/lib/lesson/view";
import { freshSeed } from "@/lib/random";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { ENTRY_WITH_AUDIO } from "@/lib/supabase/queries/entry-select";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Admins play a draft lesson or quiz exactly as learners will. Nothing is recorded. */
export default async function PreviewPage({ params }: PageProps<"/[locale]/preview/[kind]/[contentId]">) {
  const { kind, contentId } = await params;
  if ((kind !== "lesson" && kind !== "quiz") || !z.uuid().safeParse(contentId).success) notFound();

  let supabase;
  try {
    ({ supabase } = await requireAdmin());
  } catch (error) {
    if (error instanceof AdminAccessError) notFound();
    throw error;
  }

  const locale = await getLocale();
  const t = await getTranslations("Admin.builder");
  const builderPath = `/admin/${kind === "lesson" ? "lessons" : "quizzes"}/${contentId}`;
  const exitHref = getPathname({ href: builderPath, locale });
  const content = await getContent(kind, contentId);
  if (!content) notFound();

  const parsed = kind === "lesson" ? lessonStepsSchema.safeParse(content.items) : quizQuestionsSchema.safeParse(content.items);
  if (!parsed.success || parsed.data.length === 0) {
    return (
      <main id="main" className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16">
        <Notice>{t("completeFirst")}</Notice>
        <Button asChild>
          <Link href={builderPath}>{t("backToBuilder")}</Link>
        </Button>
      </main>
    );
  }

  const storageUrl = getSupabaseEnv().url;
  const ids = kind === "lesson" ? collectLessonEntryIds(lessonStepsSchema.parse(content.items)) : collectQuizEntryIds(quizQuestionsSchema.parse(content.items));
  const { data: rows } = await supabase.from("entries").select(ENTRY_WITH_AUDIO).in("id", ids).returns<EntryRow[]>();
  const entryRows = rows ?? [];
  const glossary = buildGlossary(entryRows, storageUrl);
  const title = parseLocalizedText(content.title);

  if (kind === "lesson") {
    const notes = await listCultureNoteOptions();
    const steps = buildLessonView({ steps: lessonStepsSchema.parse(content.items), entries: entryRows, cultureNotes: notes, storageUrl });
    return <LessonPlayer levelId={null} lesson={{ id: content.id, title, steps, glossary }} exitHref={exitHref} />;
  }

  return (
    <PreviewQuiz
      quiz={{
        id: content.id,
        title,
        questions: quizQuestionsSchema.parse(content.items),
        entries: Object.fromEntries(entryRows.map((row) => [row.id, toViewEntry(row, storageUrl)])),
        glossary,
      }}
      seed={freshSeed()}
      exitHref={exitHref}
    />
  );
}
