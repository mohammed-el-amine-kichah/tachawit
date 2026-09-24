"use client";

import { useTranslations } from "next-intl";
import type { AudioPlayer } from "@/hooks/use-audio-player";
import type { AudioInfo } from "@/lib/lesson/view";
import { cn } from "@/lib/utils";
import { PlayButton } from "./play-button";
import { SlowToggle } from "./slow-toggle";
import { Waveform } from "./waveform";

/** Play button, slow mode and waveform for one clip, plus the speaker credit. */
export function AudioControls({
  audio,
  player,
  label,
  className,
}: {
  audio: AudioInfo | null;
  player: AudioPlayer;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("Audio");
  return (
    <div className={cn("flex w-full flex-col items-center gap-4", className)}>
      <PlayButton player={player} label={label} />
      <Waveform url={audio?.url ?? null} player={player} className="max-w-xs" />
      <div className="flex items-center gap-3">
        <SlowToggle player={player} />
      </div>
      {audio?.speaker && <p className="text-xs text-muted-foreground">{t("speaker", { name: audio.speaker })}</p>}
      {!audio && <p className="text-sm text-muted-foreground">{t("unavailable")}</p>}
    </div>
  );
}
