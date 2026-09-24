"use client";

import { useTranslations } from "next-intl";
import type { QuizView } from "@/lib/supabase/queries/quizzes";
import { QuizPlayer } from "./quiz-player";

const ignore = () => {};

/** A draft quiz played exactly as learners will, without recording anything. */
export function PreviewQuiz({ quiz, seed, exitHref }: { quiz: QuizView; seed: number; exitHref: string }) {
  const t = useTranslations("Quiz");
  return (
    <QuizPlayer
      questions={quiz.questions}
      entries={quiz.entries}
      glossary={quiz.glossary}
      seed={seed}
      title={t("complete")}
      onComplete={ignore}
      exitHref={exitHref}
    />
  );
}
