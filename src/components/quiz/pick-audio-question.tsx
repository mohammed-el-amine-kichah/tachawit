"use client";

import { Volume2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocalizedContent } from "@/components/shared/localized-content";
import { playOnce } from "@/lib/audio/bus";
import type { QuizItem } from "@/lib/quiz/build";
import { ChoiceButton, choiceState } from "./choice-button";
import { QuestionPrompt } from "./question-prompt";
import type { QuestionProps } from "./types";

type Item = Extract<QuizItem, { type: "pick_audio" }>;

/** Read the meaning, then pick the recording that says it. */
export function PickAudioQuestion({ item, status, onCheckChange }: QuestionProps<Item>) {
  const t = useTranslations("Quiz");
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionPrompt item={item} />
      <LocalizedContent
        value={item.answer.translations}
        as="p"
        className="rounded-2xl bg-accent px-5 py-3 text-center text-2xl font-semibold text-accent-foreground"
      />
      <div role="group" className="grid w-full grid-cols-2 gap-3">
        {item.options.map((option, index) => (
          <ChoiceButton
            key={option.id}
            state={choiceState(option.id, selected, item.answer.id, status)}
            disabled={status !== "answering"}
            aria-label={t("option", { number: index + 1 })}
            onClick={() => {
              void playOnce(option.audio.url);
              setSelected(option.id);
              onCheckChange(() => option.id === item.answer.id);
            }}
            className="min-h-24 flex-col justify-center"
          >
            <span className="flex flex-col items-center gap-1">
              <Volume2Icon aria-hidden className="size-8 text-primary" />
              <span className="text-sm text-muted-foreground">{index + 1}</span>
            </span>
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
