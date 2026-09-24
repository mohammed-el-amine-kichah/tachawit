"use client";

import { useAutoplay } from "@/components/lesson/autoplay-context";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { PlayButton } from "@/components/audio/play-button";
import { SlowToggle } from "@/components/audio/slow-toggle";
import { useScript } from "@/components/shared/preferences-provider";
import { scriptClassName } from "@/components/shared/tachawit-text";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { buildTiles, type QuizItem } from "@/lib/quiz/build";
import { sameSequence } from "@/lib/quiz/check";
import { scriptMeta } from "@/lib/script/scripts";
import { cn } from "@/lib/utils";
import { QuestionPrompt } from "./question-prompt";
import type { QuestionProps } from "./types";

type Item = Extract<QuizItem, { type: "build_sentence" }>;

const tileClassName =
  "rounded-xl border-b-4 border-shade bg-card px-3 py-2 text-xl font-semibold ring-1 ring-border transition-transform duration-150 active:translate-y-0.5 active:border-b-2";

/** Listen, then tap the word tiles in the right order. */
export function BuildSentenceQuestion({ item, status, seed, onCheckChange }: QuestionProps<Item>) {
  const t = useTranslations("Quiz");
  const { script } = useScript();
  const player = useAudioPlayer(item.answer.audio);
  const { play } = player;
  const autoPlay = useAutoplay();
  const { answer, tiles } = useMemo(() => buildTiles(item.answer, item.distractors, script, seed), [item, script, seed]);
  const [placed, setPlaced] = useState<string[]>([]);
  const meta = scriptMeta[script];

  useEffect(() => {
    if (autoPlay) play();
  }, [play, autoPlay]);

  const update = (next: string[]) => {
    setPlaced(next);
    const words = next.map((id) => tiles.find((tile) => tile.id === id)!.text);
    onCheckChange(next.length ? () => sameSequence(words, answer) : null);
  };

  const locked = status !== "answering";
  const font = scriptClassName[script];

  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionPrompt item={item} />
      <div className="flex items-center gap-4">
        <PlayButton player={player} size="md" />
        <SlowToggle player={player} />
      </div>

      <div
        dir={meta.dir}
        lang={meta.lang}
        aria-label={t("yourAnswer")}
        className={cn(
          "flex min-h-20 w-full flex-wrap content-start gap-2 border-b-2 border-dashed pb-3",
          status === "correct" && "border-success",
          status === "wrong" && "border-destructive motion-safe:animate-nudge",
        )}
      >
        {placed.map((id) => {
          const tile = tiles.find((x) => x.id === id)!;
          return (
            <button key={id} type="button" disabled={locked} className={cn(tileClassName, font)} onClick={() => update(placed.filter((p) => p !== id))}>
              {tile.text}
            </button>
          );
        })}
      </div>

      <div dir={meta.dir} lang={meta.lang} className="flex flex-wrap justify-center gap-2">
        {tiles.map((tile) =>
          placed.includes(tile.id) ? (
            <span key={tile.id} aria-hidden className={cn(tileClassName, font, "invisible")}>
              {tile.text}
            </span>
          ) : (
            <button key={tile.id} type="button" disabled={locked} className={cn(tileClassName, font)} onClick={() => update([...placed, tile.id])}>
              {tile.text}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
