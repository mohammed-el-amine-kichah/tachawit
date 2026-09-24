"use client";

import { HandIcon, PlayIcon, RotateCcwIcon, SnailIcon, UndoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { saveTimestamps } from "@/app/actions/admin/clips";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { timestampsFromTaps } from "@/lib/admin/timestamps";
import { activeWordIndex } from "@/lib/audio/karaoke";
import type { WordTimestamp } from "@/lib/content/word-timestamps";
import { cn } from "@/lib/utils";
import { useAdminAction } from "../use-admin-action";

/**
 * Word timings by ear: play the clip and tap as each word starts (and once more where the last
 * word ends). Then play it back with the highlighting to check before saving.
 */
export function TimestampEditor({
  clipId,
  url,
  durationMs,
  words,
  initial,
  onSaved,
}: {
  clipId: string;
  url: string;
  durationMs: number;
  words: string[];
  initial: WordTimestamp[] | null;
  onSaved: () => void;
}) {
  const t = useTranslations("Admin.timings");
  const { run, pending } = useAdminAction();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [taps, setTaps] = useState<number[]>([]);
  const [mode, setMode] = useState<"idle" | "tapping" | "checking">("idle");
  const [slow, setSlow] = useState(false);
  const [active, setActive] = useState(-1);
  const result = taps.length ? timestampsFromTaps(words, taps, durationMs) : initial;

  useEffect(() => {
    const element = new Audio(url);
    element.preload = "auto";
    audio.current = element;
    const ended = () => setMode("idle");
    element.addEventListener("ended", ended);
    return () => {
      element.pause();
      element.removeEventListener("ended", ended);
    };
  }, [url]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = slow ? 0.6 : 1;
  }, [slow]);

  useEffect(() => {
    if (mode !== "checking" || !result) return;
    let frame = 0;
    const tick = () => {
      setActive(activeWordIndex(result, (audio.current?.currentTime ?? 0) * 1000));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      setActive(-1);
    };
  }, [mode, result]);

  const play = (next: "tapping" | "checking") => {
    const element = audio.current;
    if (!element) return;
    if (next === "tapping") setTaps([]);
    element.currentTime = 0;
    void element.play();
    setMode(next);
  };

  const tap = () => {
    if (mode !== "tapping" || !audio.current || taps.length > words.length) return;
    setTaps((current) => [...current, Math.round(audio.current!.currentTime * 1000)]);
  };

  const next = taps.length < words.length ? words[taps.length] : taps.length === words.length ? t("endMark") : null;

  return (
    <div
      className="flex flex-col gap-5"
      onKeyDown={(event) => {
        if (event.key === " " && mode === "tapping") {
          event.preventDefault();
          tap();
        }
      }}
    >
      <p className="text-sm text-muted-foreground">{t("help")}</p>

      <ol className="flex flex-wrap gap-2" dir="ltr">
        {words.map((word, i) => (
          <li
            key={i}
            className={cn(
              "rounded-lg px-2.5 py-1 text-lg font-semibold ring-1 ring-border transition-colors",
              i < taps.length && "bg-success/15 ring-success",
              mode === "tapping" && i === taps.length && "ring-2 ring-primary",
              active === i && "bg-gold/50",
            )}
          >
            {word}
            {result?.[i] && <span className="ms-2 text-xs font-normal text-muted-foreground tabular-nums">{(result[i].startMs / 1000).toFixed(2)}s</span>}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => play("tapping")} variant={mode === "tapping" ? "secondary" : "default"}>
          <PlayIcon aria-hidden />
          {taps.length ? t("restart") : t("start")}
        </Button>
        <Toggle variant="outline" pressed={slow} onPressedChange={setSlow} aria-label={t("slow")}>
          <SnailIcon aria-hidden />
          {t("slow")}
        </Toggle>
        <Button type="button" variant="ghost" disabled={!taps.length} onClick={() => setTaps((c) => c.slice(0, -1))}>
          <UndoIcon aria-hidden />
          {t("undo")}
        </Button>
      </div>

      <Button type="button" size="lg" disabled={mode !== "tapping" || !next} onClick={tap} className="h-20 text-xl">
        <HandIcon aria-hidden className="size-6" />
        {next ? t("tap", { word: next }) : t("done")}
      </Button>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button type="button" variant="outline" disabled={!result} onClick={() => play("checking")}>
          {t("check")}
        </Button>
        <Button
          type="button"
          disabled={!result || pending || !taps.length}
          onClick={() => run(() => saveTimestamps(clipId, result), { success: t("saved"), onSuccess: onSaved })}
        >
          {t("save")}
        </Button>
        {initial && (
          <Button type="button" variant="ghost" disabled={pending} onClick={() => run(() => saveTimestamps(clipId, []), { success: t("cleared"), onSuccess: onSaved })}>
            <RotateCcwIcon aria-hidden />
            {t("clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
