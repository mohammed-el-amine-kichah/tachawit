"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { PlayButton } from "@/components/audio/play-button";
import { LocalizedContent } from "@/components/shared/localized-content";
import { useScript } from "@/components/shared/preferences-provider";
import { scriptClassName } from "@/components/shared/tachawit-text";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { buildBlank, type QuizItem } from "@/lib/quiz/build";
import { scriptMeta } from "@/lib/script/scripts";
import { cn } from "@/lib/utils";
import { ChoiceButton, choiceState } from "./choice-button";
import { QuestionPrompt } from "./question-prompt";
import type { QuestionProps } from "./types";

type Item = Extract<QuizItem, { type: "fill_blank" }>;

/** A phrase with one word missing: pick the word that completes it. */
export function FillBlankQuestion({ item, status, seed, onCheckChange }: QuestionProps<Item>) {
  const t = useTranslations("Quiz");
  const { script } = useScript();
  const player = useAudioPlayer(item.answer.audio);
  const blank = useMemo(() => buildBlank(item.answer, item.blankWordIndex, item.distractors, script, seed), [item, script, seed]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!blank) onCheckChange(() => true);
  }, [blank, onCheckChange]);

  if (!blank) return <QuestionPrompt item={item} />;
  const meta = scriptMeta[blank.script];
  const font = scriptClassName[blank.script];

  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionPrompt item={item} />
      <PlayButton player={player} size="md" />
      <p dir={meta.dir} lang={meta.lang} className={cn("flex flex-wrap items-baseline justify-center gap-2 text-3xl font-semibold", font)}>
        {blank.before.map((w, i) => (
          <span key={`b${i}`}>{w}</span>
        ))}
        <span
          aria-label={t("blank")}
          className={cn(
            "min-w-20 rounded-lg border-b-4 px-2 text-center",
            status === "correct" ? "border-success text-success" : status === "wrong" ? "border-destructive" : "border-primary",
          )}
        >
          {status === "wrong" ? blank.answer : (selected ?? " ")}
        </span>
        {blank.after.map((w, i) => (
          <span key={`a${i}`}>{w}</span>
        ))}
      </p>
      <LocalizedContent value={item.answer.translations} as="p" className="text-lg text-muted-foreground" />
      <div role="group" dir={meta.dir} lang={meta.lang} className="grid w-full grid-cols-2 gap-3">
        {blank.options.map((word) => (
          <ChoiceButton
            key={word}
            state={choiceState(word, selected, blank.answer, status)}
            disabled={status !== "answering"}
            className={cn("justify-center text-center", font)}
            onClick={() => {
              setSelected(word);
              onCheckChange(() => word === blank.answer);
            }}
          >
            {word}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
