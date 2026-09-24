"use client";

import { useLocale, useTranslations } from "next-intl";
import { localize } from "@/i18n/localize";
import { useCallback } from "react";
import { useProgress } from "@/components/progress/progress-provider";
import type { QuizView } from "@/lib/supabase/queries/quizzes";
import { QuizPlayer, type QuizSummary } from "./quiz-player";

/** A quiz or challenge level on the map. */
export function LevelQuiz({ levelId, quiz, seed }: { levelId: string; quiz: QuizView; seed: number }) {
  const t = useTranslations("Quiz");
  const locale = useLocale();
  const { completeLevel } = useProgress();
  const onComplete = useCallback(
    (summary: QuizSummary) => completeLevel({ levelId, stars: summary.stars ?? 1, xp: summary.xp, entryIds: summary.words }),
    [completeLevel, levelId],
  );
  return (
    <QuizPlayer
      questions={quiz.questions}
      entries={quiz.entries}
      glossary={quiz.glossary}
      seed={seed}
      title={t("complete")}
      heading={localize(quiz.title, locale)?.text}
      onComplete={onComplete}
    />
  );
}
