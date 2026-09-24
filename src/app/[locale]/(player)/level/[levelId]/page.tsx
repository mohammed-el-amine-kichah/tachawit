import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { LevelQuiz } from "@/components/quiz/level-quiz";
import { localize } from "@/i18n/localize";
import { getPathname } from "@/i18n/navigation";
import { freshSeed } from "@/lib/random";
import { routing } from "@/i18n/routing";
import { getLessonView } from "@/lib/supabase/queries/lessons";
import { getLevel } from "@/lib/supabase/queries/levels";
import { getQuizView } from "@/lib/supabase/queries/quizzes";

export async function generateMetadata({ params }: PageProps<"/[locale]/level/[levelId]">): Promise<Metadata> {
  const { locale, levelId } = await params;
  const level = await getLevel(levelId);
  if (!level || !hasLocale(routing.locales, locale)) return {};
  return { title: localize(level.title ?? level.unitTitle, locale)?.text, robots: { index: false } };
}

export default async function LevelPage({ params }: PageProps<"/[locale]/level/[levelId]">) {
  const { levelId } = await params;
  const level = await getLevel(levelId);
  if (!level) notFound();

  if ((level.type === "lesson" || level.type === "story") && level.lessonId) {
    const lesson = await getLessonView(level.lessonId);
    if (!lesson) notFound();
    return <LessonPlayer levelId={level.id} lesson={lesson} />;
  }

  if ((level.type === "quiz" || level.type === "boss") && level.quizId) {
    const quiz = await getQuizView(level.quizId);
    if (!quiz) notFound();
    // A fresh order for every attempt; generated on the server so hydration matches.
    return <LevelQuiz levelId={level.id} quiz={quiz} seed={freshSeed()} />;
  }

  if (level.type === "review") {
    const { locale } = await params;
    redirect(`${getPathname({ href: "/review", locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale })}?level=${level.id}`);
  }

  notFound();
}
