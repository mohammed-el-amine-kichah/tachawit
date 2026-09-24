"use client";

import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AudioControls } from "@/components/audio/audio-controls";
import { LocalizedContent } from "@/components/shared/localized-content";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import type { AudioInfo, ViewEntry } from "@/lib/lesson/view";
import { splitWords } from "@/lib/audio/karaoke";
import { EntryImage } from "./entry-image";
import { EntryTags } from "./entry-tags";
import { KaraokeText } from "./karaoke-text";
import { StepLabel } from "./step-label";

/** A new word or phrase: picture, text in the chosen script, meaning, and the speaker's voice. */
export function IntroduceStep({ entry, audio, autoPlay = true }: { entry: ViewEntry; audio: AudioInfo | null; autoPlay?: boolean }) {
  const t = useTranslations("Lesson");
  const player = useAudioPlayer(audio);
  const { play } = player;

  useEffect(() => {
    if (autoPlay) play();
  }, [play, autoPlay]);

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <StepLabel icon={SparklesIcon}>{t("newWord")}</StepLabel>
      <EntryImage src={entry.imageUrl} alt={entry.text_latin} />
      <KaraokeText entry={entry} audio={audio} player={player} className="text-4xl font-semibold sm:text-5xl" />
      <LocalizedContent value={entry.translations} as="p" className="text-xl text-muted-foreground" />
      <EntryTags entry={entry} />
      <AudioControls audio={audio} player={player} label={entry.text_latin} className="mt-2" />
      {splitWords(entry.text_latin).length > 1 && <p className="text-xs text-muted-foreground">{t("tapWord")}</p>}
    </div>
  );
}
