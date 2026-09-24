import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { localize } from "@/i18n/localize";
import { routing } from "@/i18n/routing";
import { getLessonView } from "@/lib/supabase/queries/lessons";
import { getLevel } from "@/lib/supabase/queries/levels";

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

  notFound();
}
