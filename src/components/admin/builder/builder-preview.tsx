"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AutoplayContext } from "@/components/lesson/autoplay-context";
import { GlossaryContext } from "@/components/lesson/glossary-context";
import { LessonStepView } from "@/components/lesson/lesson-step-view";
import { QuestionView } from "@/components/quiz/question-view";
import { ScriptToggle } from "@/components/shared/script-toggle";
import type { DraftItem } from "@/lib/admin/builder";
import { lessonStepSchema } from "@/lib/content/lesson";
import { quizQuestionSchema } from "@/lib/content/quiz";
import { buildGlossary, buildLessonView, toViewEntry, type CultureNoteRow, type EntryRow } from "@/lib/lesson/view";
import { buildQuizItems } from "@/lib/quiz/build";

const noop = () => {};

/** The selected step or question rendered by the learner's own components. */
export function BuilderPreview({
  kind,
  item,
  rows,
  notes,
}: {
  kind: "lesson" | "quiz";
  item: DraftItem | null;
  rows: Record<string, EntryRow>;
  notes: CultureNoteRow[];
}) {
  const t = useTranslations("Admin.builder");
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const entryRows = useMemo(() => Object.values(rows), [rows]);
  const glossary = useMemo(() => buildGlossary(entryRows, storageUrl), [entryRows, storageUrl]);

  const content = (() => {
    if (!item) return <p className="py-16 text-center text-sm text-muted-foreground">{t("previewSelect")}</p>;
    if (kind === "lesson") {
      const step = lessonStepSchema.safeParse(item);
      const [view] = step.success ? buildLessonView({ steps: [step.data], entries: entryRows, cultureNotes: notes, storageUrl }) : [];
      return view ? <LessonStepView key={item.id} step={view} /> : <p className="py-16 text-center text-sm text-muted-foreground">{t("previewIncomplete")}</p>;
    }
    const question = quizQuestionSchema.safeParse(item);
    const entries = Object.fromEntries(entryRows.map((row) => [row.id, toViewEntry(row, storageUrl)]));
    const [quizItem] = question.success ? buildQuizItems([question.data], entries, 1) : [];
    return quizItem ? (
      <QuestionView key={JSON.stringify(item)} item={quizItem} status="answering" seed={1} onCheckChange={noop} onAnswer={noop} />
    ) : (
      <p className="py-16 text-center text-sm text-muted-foreground">{t("previewIncomplete")}</p>
    );
  })();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-muted-foreground">{t("preview")}</p>
        <ScriptToggle />
      </div>
      <div className="rounded-[2rem] border-8 border-muted bg-background p-4 shadow-raised">
        <AutoplayContext value={false}>
          <GlossaryContext value={glossary}>{content}</GlossaryContext>
        </AutoplayContext>
      </div>
    </div>
  );
}
