"use client";

import { useEffect, useState } from "react";
import { PlayButton } from "@/components/audio/play-button";
import { SlowToggle } from "@/components/audio/slow-toggle";
import { LocalizedContent } from "@/components/shared/localized-content";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import type { QuizItem } from "@/lib/quiz/build";
import { ChoiceButton, choiceState } from "./choice-button";
import { QuestionPrompt } from "./question-prompt";
import type { QuestionProps } from "./types";

type Item = Extract<QuizItem, { type: "listen_pick_translation" }>;

/** Listen, then pick the right meaning. */
export function ListenPickQuestion({ item, status, onCheckChange }: QuestionProps<Item>) {
  const player = useAudioPlayer(item.answer.audio);
  const { play } = player;
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    play();
  }, [play]);

  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionPrompt item={item} />
      <div className="flex items-center gap-4">
        <PlayButton player={player} size="lg" />
        <SlowToggle player={player} />
      </div>
      <div role="group" className="grid w-full gap-3">
        {item.options.map((option) => (
          <ChoiceButton
            key={option.id}
            state={choiceState(option.id, selected, item.answer.id, status)}
            disabled={status !== "answering"}
            onClick={() => {
              setSelected(option.id);
              onCheckChange(() => option.id === item.answer.id);
            }}
          >
            <LocalizedContent value={option.translations} />
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
