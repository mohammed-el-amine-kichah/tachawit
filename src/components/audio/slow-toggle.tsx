"use client";

import { SnailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Toggle } from "@/components/ui/toggle";
import type { AudioPlayer } from "@/hooks/use-audio-player";

export function SlowToggle({ player }: { player: AudioPlayer }) {
  const t = useTranslations("Audio");
  return (
    <Toggle
      variant="outline"
      size="lg"
      pressed={player.slow}
      onPressedChange={player.setSlow}
      disabled={!player.available}
      aria-label={t("slow")}
      className="h-11 gap-1.5 rounded-full px-4 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
    >
      <SnailIcon aria-hidden />
      <span className="text-sm">{t("slow")}</span>
    </Toggle>
  );
}
