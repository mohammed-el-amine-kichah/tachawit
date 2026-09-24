"use client";

import { MessagesSquareIcon, PlayIcon, SquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { PlayButton } from "@/components/audio/play-button";
import { LocalizedContent } from "@/components/shared/localized-content";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { playOnce } from "@/lib/audio/bus";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { AudioInfo, ViewEntry } from "@/lib/lesson/view";
import { cn } from "@/lib/utils";
import { KaraokeText } from "./karaoke-text";
import { StepLabel } from "./step-label";

type Line = { speaker: string; entry: ViewEntry; audio: AudioInfo | null };

function DialogueLine({ line, first, speaking }: { line: Line; first: boolean; speaking: boolean }) {
  const player = useAudioPlayer(line.audio);
  return (
    <li className={cn("flex items-end gap-2", first ? "flex-row" : "flex-row-reverse")}>
      <span
        aria-hidden
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
          first ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        {line.speaker.slice(0, 2)}
      </span>
      <div
        className={cn(
          "max-w-[80%] rounded-3xl px-4 py-3 shadow-soft ring-1 ring-border transition-colors duration-200",
          first ? "rounded-es-md bg-card" : "rounded-ee-md bg-accent",
          speaking && "ring-2 ring-gold",
        )}
      >
        <p className="sr-only">{line.speaker}</p>
        <div className="flex items-center gap-3">
          <PlayButton player={player} size="sm" label={line.entry.text_latin} />
          <KaraokeText entry={line.entry} audio={line.audio} player={player} className="justify-start text-2xl font-semibold" />
        </div>
        <LocalizedContent value={line.entry.translations} as="p" className="mt-1 text-start text-sm text-muted-foreground" />
      </div>
    </li>
  );
}

/** A short conversation between speakers, line by line, or played end to end. */
export function DialogueStep({ title, lines }: { title: LocalizedText | null; lines: Line[] }) {
  const t = useTranslations("Lesson");
  const [speaking, setSpeaking] = useState<number | null>(null);
  const runRef = useRef(0);
  const firstSpeaker = lines[0]?.speaker;

  useEffect(() => () => {
    runRef.current += 1;
  }, []);

  const playAll = async () => {
    const run = ++runRef.current;
    for (const [index, line] of lines.entries()) {
      if (runRef.current !== run) return;
      if (!line.audio) continue;
      setSpeaking(index);
      await playOnce(line.audio.url);
    }
    if (runRef.current === run) setSpeaking(null);
  };

  const stop = () => {
    runRef.current += 1;
    setSpeaking(null);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <StepLabel icon={MessagesSquareIcon}>{t("dialogue")}</StepLabel>
      <LocalizedContent value={title} as="h2" className="text-center text-2xl font-semibold" />
      <ol className="flex w-full flex-col gap-3">
        {lines.map((line, index) => (
          <DialogueLine key={index} line={line} first={line.speaker === firstSpeaker} speaking={speaking === index} />
        ))}
      </ol>
      {speaking === null ? (
        <Button size="lg" variant="secondary" onClick={() => void playAll()} className="h-11 rounded-full px-5">
          <PlayIcon aria-hidden />
          {t("playConversation")}
        </Button>
      ) : (
        <Button size="lg" variant="outline" onClick={stop} className="h-11 rounded-full px-5">
          <SquareIcon aria-hidden className="fill-current" />
          {t("stopConversation")}
        </Button>
      )}
    </div>
  );
}
