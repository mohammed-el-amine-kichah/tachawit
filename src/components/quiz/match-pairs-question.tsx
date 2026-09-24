"use client";

import { CheckIcon, Volume2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { LocalizedContent } from "@/components/shared/localized-content";
import { playOnce } from "@/lib/audio/bus";
import type { QuizItem } from "@/lib/quiz/build";
import { cn } from "@/lib/utils";
import { QuestionPrompt } from "./question-prompt";
import type { QuestionProps } from "./types";

type Item = Extract<QuizItem, { type: "match_pairs" }>;

const cell =
  "flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-shade px-3 py-2 text-center font-medium ring-1 transition-[transform,background-color,opacity] duration-150 active:translate-y-0.5 active:border-b-2";

/** Match each recording with its meaning. Mismatches just shake; the question ends when all match. */
export function MatchPairsQuestion({ item, status, onAnswer }: QuestionProps<Item>) {
  const t = useTranslations("Quiz");
  const [sound, setSound] = useState<string | null>(null);
  const [meaning, setMeaning] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [miss, setMiss] = useState<{ sound: string; meaning: string } | null>(null);
  const mistakes = useRef(0);

  useEffect(() => {
    if (!miss) return;
    const timer = setTimeout(() => setMiss(null), 450);
    return () => clearTimeout(timer);
  }, [miss]);

  const tryPair = (soundId: string | null, meaningId: string | null) => {
    if (!soundId || !meaningId) return;
    setSound(null);
    setMeaning(null);
    if (soundId === meaningId) {
      const next = [...matched, soundId];
      setMatched(next);
      if (next.length === item.pairs.length) onAnswer(mistakes.current === 0);
    } else {
      mistakes.current += 1;
      setMiss({ sound: soundId, meaning: meaningId });
    }
  };

  const locked = status !== "answering";

  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionPrompt item={item} />
      <div className="grid w-full grid-cols-2 gap-3">
        <div className="flex flex-col gap-3" role="group" aria-label={t("sounds")}>
          {item.pairs.map((pair, index) => {
            const done = matched.includes(pair.id);
            return (
              <button
                key={pair.id}
                type="button"
                disabled={done || locked}
                aria-label={t("option", { number: index + 1 })}
                aria-pressed={sound === pair.id}
                onClick={() => {
                  void playOnce(pair.audio.url);
                  setSound(pair.id);
                  tryPair(pair.id, meaning);
                }}
                className={cn(
                  cell,
                  done ? "bg-success/15 opacity-60 ring-success" : sound === pair.id ? "bg-accent ring-2 ring-primary" : "bg-card ring-border",
                  miss?.sound === pair.id && "bg-destructive/10 ring-destructive motion-safe:animate-nudge",
                )}
              >
                {done ? <CheckIcon aria-hidden className="size-6 text-success" /> : <Volume2Icon aria-hidden className="size-6 text-primary" />}
                <span className="text-sm text-muted-foreground">{index + 1}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3" role="group" aria-label={t("meanings")}>
          {item.meanings.map((pair) => {
            const done = matched.includes(pair.id);
            return (
              <button
                key={pair.id}
                type="button"
                disabled={done || locked}
                aria-pressed={meaning === pair.id}
                onClick={() => {
                  setMeaning(pair.id);
                  tryPair(sound, pair.id);
                }}
                className={cn(
                  cell,
                  done ? "bg-success/15 opacity-60 ring-success" : meaning === pair.id ? "bg-accent ring-2 ring-primary" : "bg-card ring-border",
                  miss?.meaning === pair.id && "bg-destructive/10 ring-destructive motion-safe:animate-nudge",
                )}
              >
                <LocalizedContent value={pair.translations} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
