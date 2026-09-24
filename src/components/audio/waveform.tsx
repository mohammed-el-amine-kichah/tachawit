"use client";

import { motion, useTransform } from "motion/react";
import { useLocale } from "next-intl";
import type { PointerEvent } from "react";
import { usePeaks } from "@/hooks/use-peaks";
import type { AudioPlayer } from "@/hooks/use-audio-player";
import { getDirection } from "@/i18n/config";
import { cn } from "@/lib/utils";

function Bars({ peaks, className, animate }: { peaks: number[]; className: string; animate?: boolean }) {
  return (
    <div className="flex h-full items-center gap-[3px]">
      {peaks.map((peak, i) => (
        <span
          key={i}
          className={cn("w-full origin-center rounded-full", className, animate && "motion-safe:animate-wave")}
          style={{ height: `${Math.max(10, peak * 100)}%`, animationDelay: animate ? `${(i % 8) * 60}ms` : undefined }}
        />
      ))}
    </div>
  );
}

/** The clip's waveform, filling in as it plays. Tap to jump. Decorative for assistive tech. */
export function Waveform({
  url,
  player,
  bars = 40,
  className,
}: {
  url: string | null;
  player: AudioPlayer;
  bars?: number;
  className?: string;
}) {
  const rtl = getDirection(useLocale()) === "rtl";
  const peaks = usePeaks(url, bars);
  const clipPath = useTransform(player.progress, (p) => {
    const hidden = `${((1 - p) * 100).toFixed(2)}%`;
    return rtl ? `inset(0 0 0 ${hidden})` : `inset(0 ${hidden} 0 0)`;
  });

  const seek = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    player.seek(rtl ? 1 - fraction : fraction);
  };

  return (
    <div aria-hidden onPointerDown={player.available ? seek : undefined} className={cn("relative h-14 w-full touch-none", player.available && "cursor-pointer", className)}>
      <Bars peaks={peaks} className="bg-muted-foreground/25" />
      <motion.div className="absolute inset-0" style={{ clipPath }}>
        <Bars peaks={peaks} className="bg-primary" animate={player.playing} />
      </motion.div>
    </div>
  );
}
