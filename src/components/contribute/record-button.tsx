"use client";

import { MicIcon, SquareIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MAX_RECORDING_SECONDS, WARN_RECORDING_SECONDS } from "@/lib/contribute/quality";
import { pressable } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { LevelMeter } from "./level-meter";

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** One large button: tap to record, tap to stop, with a timer and a live level meter. */
export function RecordButton({
  recording,
  requesting,
  stream,
  onStart,
  onStop,
}: {
  recording: boolean;
  requesting: boolean;
  stream: MediaStream | null;
  onStart: () => void;
  onStop: () => void;
}) {
  const t = useTranslations("Contribute");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250);
    return () => {
      clearInterval(timer);
      setElapsed(0);
    };
  }, [recording]);

  const warning = recording && elapsed >= WARN_RECORDING_SECONDS;

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        type="button"
        {...pressable}
        onClick={recording ? onStop : onStart}
        disabled={requesting}
        aria-label={recording ? t("stopRecording") : t("startRecording")}
        className={cn(
          "flex size-24 items-center justify-center rounded-full text-primary-foreground shadow-soft outline-none focus-visible:ring-4 focus-visible:ring-ring/50 disabled:opacity-60",
          recording ? "bg-destructive" : "bg-primary",
        )}
      >
        {recording ? <SquareIcon aria-hidden className="size-9 fill-current" /> : <MicIcon aria-hidden className="size-10" />}
      </motion.button>
      <div className="flex h-6 items-center gap-3 text-sm">
        {recording ? (
          <>
            {stream && <LevelMeter stream={stream} />}
            <span className={cn("tabular-nums", warning ? "font-semibold text-destructive" : "text-muted-foreground")} dir="ltr">
              {clock(elapsed)}
            </span>
            {warning && (
              <span role="status" className="text-destructive">
                {t("stopsIn", { seconds: Math.max(0, MAX_RECORDING_SECONDS - elapsed) })}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">{t("tapToRecord")}</span>
        )}
      </div>
    </div>
  );
}
