"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { PlayButton } from "@/components/audio/play-button";
import { VoiceRecorder } from "@/components/audio/voice-recorder";
import { LocalizedContent } from "@/components/shared/localized-content";
import { TachawitText } from "@/components/shared/tachawit-text";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import type { QuizItem } from "@/lib/quiz/build";
import { QuestionPrompt } from "./question-prompt";
import type { QuestionProps } from "./types";

type Item = Extract<QuizItem, { type: "speak" }>;

/** Say it out loud. Recording and comparing is optional and never scored in v1. */
export function SpeakQuestion({ item, onCheckChange }: QuestionProps<Item>) {
  const t = useTranslations("Quiz");
  const player = useAudioPlayer(item.answer.audio);

  useEffect(() => {
    onCheckChange(() => true);
  }, [onCheckChange]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <QuestionPrompt item={item} />
      <TachawitText entry={item.answer} as="p" className="text-4xl font-semibold" />
      <LocalizedContent value={item.answer.translations} as="p" className="text-lg text-muted-foreground" />
      <PlayButton player={player} size="md" label={item.answer.text_latin} />
      <div className="w-full rounded-3xl bg-card p-4 shadow-soft ring-1 ring-border">
        <p className="mb-3 text-sm text-muted-foreground">{t("speakHint")}</p>
        <VoiceRecorder modelUrl={item.answer.audio?.url ?? null} />
      </div>
    </div>
  );
}
