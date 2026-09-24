"use client";

import { useMotionValueEvent } from "motion/react";
import { Volume2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocalizedContent } from "@/components/shared/localized-content";
import { useScript } from "@/components/shared/preferences-provider";
import { scriptClassName } from "@/components/shared/tachawit-text";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AudioPlayer } from "@/hooks/use-audio-player";
import { playOnce } from "@/lib/audio/bus";
import { activeWordIndex, alignTimestamps, normalizeWord, splitWords, wordSegment } from "@/lib/audio/karaoke";
import type { AudioInfo, ViewEntry } from "@/lib/lesson/view";
import { resolveTachawitText } from "@/lib/script/resolve";
import { cn } from "@/lib/utils";
import { useGlossary } from "./glossary-context";

/**
 * Tachawit text as tappable words. While the clip plays, the spoken word lights up (when word
 * timings exist and line up with the displayed script). Tapping a word plays it and shows its meaning.
 */
export function KaraokeText({
  entry,
  audio,
  player,
  className,
}: {
  entry: ViewEntry;
  audio: AudioInfo | null;
  player: AudioPlayer;
  className?: string;
}) {
  const t = useTranslations("Audio");
  const script = useScript();
  const glossary = useGlossary();
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState<number | null>(null);

  const resolved = resolveTachawitText(entry, script.script);
  const words = splitWords(resolved.text);
  const latinWords = splitWords(entry.text_latin);
  const timings = alignTimestamps(audio?.words ?? null, words);
  const single = words.length === 1;

  useMotionValueEvent(player.time, "change", (ms) => setActive(timings ? activeWordIndex(timings, ms) : -1));

  const meaningOf = (index: number) => {
    if (single) return entry.translations;
    const latin = words.length === latinWords.length ? latinWords[index] : undefined;
    return latin ? (glossary[normalizeWord(latin)]?.translations ?? null) : null;
  };

  const say = (index: number) => {
    const latin = words.length === latinWords.length ? latinWords[index] : undefined;
    const gloss = latin ? glossary[normalizeWord(latin)] : undefined;
    if (single) player.play();
    else if (gloss?.audio && gloss.entryId !== entry.id) void playOnce(gloss.audio.url);
    else if (timings && audio) {
      const segment = wordSegment(timings, index, audio.durationMs ?? Number.POSITIVE_INFINITY);
      player.playSegment(segment.startMs, segment.endMs);
    } else player.play();
  };

  return (
    <p
      lang={resolved.lang}
      dir={resolved.dir}
      title={resolved.isFallback ? t("fallback") : undefined}
      className={cn("flex flex-wrap justify-center gap-x-1 gap-y-1 leading-tight", scriptClassName[resolved.script], className)}
    >
      {words.map((word, index) => {
        const meaning = meaningOf(index);
        return (
          <Popover key={`${word}-${index}`} open={open === index} onOpenChange={(next) => setOpen(next ? index : null)}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => say(index)}
                className={cn(
                  "rounded-xl px-1.5 transition-colors duration-150 hover:bg-accent/70",
                  active === index && "bg-gold/45 hover:bg-gold/45",
                )}
              >
                {word}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-64 text-center" sideOffset={8}>
              <div className="flex items-center justify-center gap-2">
                <span lang={resolved.lang} dir={resolved.dir} className={cn("text-xl font-semibold", scriptClassName[resolved.script])}>
                  {word}
                </span>
                <button
                  type="button"
                  onClick={() => say(index)}
                  aria-label={t("playWord", { word })}
                  className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"
                >
                  <Volume2Icon aria-hidden className="size-4" />
                </button>
              </div>
              {meaning ? (
                <LocalizedContent value={meaning} as="p" className="mt-1 text-muted-foreground" />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{t("noMeaning")}</p>
              )}
            </PopoverContent>
          </Popover>
        );
      })}
    </p>
  );
}
