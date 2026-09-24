import { useTranslations } from "next-intl";
import { LocalizedContent } from "@/components/shared/localized-content";
import type { QuizItem } from "@/lib/quiz/build";

export function QuestionPrompt({ item }: { item: QuizItem }) {
  const t = useTranslations("Quiz.prompt");
  return item.prompt ? (
    <LocalizedContent value={item.prompt} as="h2" className="text-center text-2xl font-semibold" />
  ) : (
    <h2 className="text-center text-2xl font-semibold">{t(item.type)}</h2>
  );
}
