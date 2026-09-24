"use client";

import { PauseIcon, PlayIcon, VolumeXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AudioPlayer } from "@/hooks/use-audio-player";
import { cn } from "@/lib/utils";

const sizes = {
  lg: "size-24 [&_svg]:size-10",
  md: "size-16 [&_svg]:size-7",
  sm: "size-11 [&_svg]:size-5",
} as const;

/** The big round play control. Audio is the heart of every step. */
export function PlayButton({
  player,
  size = "lg",
  label,
  className,
}: {
  player: AudioPlayer;
  size?: keyof typeof sizes;
  /** What is being played, for screen readers (e.g. the word). */
  label?: string;
  className?: string;
}) {
  const t = useTranslations("Audio");
  const name = !player.available ? t("unavailable") : player.playing ? t("pause") : t("play");

  return (
    <button
      type="button"
      onClick={player.toggle}
      disabled={!player.available}
      aria-label={label ? `${name}: ${label}` : name}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full border-b-[6px] border-shade bg-primary text-primary-foreground shadow-raised transition-transform duration-150 active:translate-y-1 active:border-b-2 disabled:bg-muted disabled:text-muted-foreground",
        sizes[size],
        className,
      )}
    >
      {player.playing && (
        <span aria-hidden className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-node-pulse" />
      )}
      {!player.available ? (
        <VolumeXIcon aria-hidden />
      ) : player.playing ? (
        <PauseIcon aria-hidden className="fill-current" />
      ) : (
        <PlayIcon aria-hidden className="fill-current translate-x-0.5" />
      )}
    </button>
  );
}
