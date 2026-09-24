"use client";

import { Repeat2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AudioControls } from "@/components/audio/audio-controls";
import { VoiceRecorder } from "@/components/audio/voice-recorder";
import { LocalizedContent } from "@/components/shared/localized-content";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import type { AudioInfo, ViewEntry } from "@/lib/lesson/view";
import { KaraokeText } from "./karaoke-text";
import { StepLabel } from "./step-label";

/** Hear it, say it out loud, and optionally record yourself to compare. */
export function ListenRepeatStep({ entry, audio }: { entry: ViewEntry; audio: AudioInfo | null }) {
  const t = useTranslations("Lesson");
  const player = useAudioPlayer(audio);
  const { play } = player;

  useEffect(() => {
    play();
  }, [play]);

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <StepLabel icon={Repeat2Icon}>{t("listenRepeat")}</StepLabel>
      <KaraokeText entry={entry} audio={audio} player={player} className="text-4xl font-semibold sm:text-5xl" />
      <LocalizedContent value={entry.translations} as="p" className="text-lg text-muted-foreground" />
      <AudioControls audio={audio} player={player} label={entry.text_latin} />
      <div className="w-full rounded-3xl bg-card p-4 shadow-soft ring-1 ring-border">
        <p className="mb-3 text-sm text-muted-foreground">{t("sayItAloud")}</p>
        <VoiceRecorder modelUrl={audio?.url ?? null} />
      </div>
    </div>
  );
}
