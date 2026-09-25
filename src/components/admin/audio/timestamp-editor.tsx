"use client";

import { PlayIcon, RotateCcwIcon, SnailIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { saveTimestamps } from "@/app/actions/admin/clips";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cutsFromTimestamps, moveCut, suggestCuts, timestampsFromCuts } from "@/lib/admin/timestamps";
import { activeWordIndex } from "@/lib/audio/karaoke";
import { computePeaks, placeholderPeaks } from "@/lib/audio/peaks";
import type { WordTimestamp } from "@/lib/content/word-timestamps";
import { cn } from "@/lib/utils";
import { useAdminAction } from "../use-admin-action";

const BARS = 160;
const STEP_MS = 10;

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;

/**
 * Word timings by cutting the recording: the waveform shows where the voice is, and a cut marks
 * where each word starts and ends. Cuts start from a guess made from the pauses; drag them (or use
 * the arrow keys), then play each word or the whole clip with highlighting to check before saving.
 */
export function TimestampEditor({
  clipId,
  url,
  durationMs: knownDurationMs,
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
  const track = useRef<HTMLDivElement>(null);
  const stopAt = useRef<number | null>(null);
  const [durationMs, setDurationMs] = useState(knownDurationMs);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [cuts, setCuts] = useState<number[]>(() => cutsFromTimestamps(words, initial, knownDurationMs) ?? []);
  const [dragging, setDragging] = useState<number | null>(null);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [slow, setSlow] = useState(false);
  const result = timestampsFromCuts(words, cuts);
  const active = checking && result && playhead !== null ? activeWordIndex(result, playhead) : -1;

  // Decode the recording once, to draw it and to guess the cuts.
  useEffect(() => {
    let cancelled = false;
    const context = new AudioContext();
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        if (cancelled) return;
        const decoded = computePeaks(buffer.getChannelData(0), BARS);
        const ms = Math.round(buffer.duration * 1000);
        setDurationMs(ms);
        setPeaks(decoded);
        setCuts((current) => (current.length === words.length + 1 ? current : suggestCuts(words, decoded, ms)));
      })
      .catch(() => {
        if (!cancelled) setCuts((current) => (current.length ? current : suggestCuts(words, [], knownDurationMs)));
      })
      .finally(() => void context.close());
    return () => {
      cancelled = true;
    };
  }, [url, words, knownDurationMs]);

  useEffect(() => {
    const element = new Audio(url);
    element.preload = "auto";
    audio.current = element;
    let frame = 0;
    const tick = () => {
      const now = element.currentTime * 1000;
      if (stopAt.current !== null && now >= stopAt.current) {
        element.pause();
        stopAt.current = null;
      }
      setPlayhead(element.paused ? null : now);
      if (!element.paused) frame = requestAnimationFrame(tick);
    };
    const started = () => {
      frame = requestAnimationFrame(tick);
    };
    const stopped = () => {
      setPlayhead(null);
      setChecking(false);
    };
    element.addEventListener("play", started);
    element.addEventListener("pause", stopped);
    element.addEventListener("ended", stopped);
    return () => {
      cancelAnimationFrame(frame);
      element.pause();
      element.removeEventListener("play", started);
      element.removeEventListener("pause", stopped);
      element.removeEventListener("ended", stopped);
    };
  }, [url]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = slow ? 0.6 : 1;
  }, [slow]);

  const play = (fromMs: number, toMs: number | null, highlight: boolean) => {
    const element = audio.current;
    if (!element) return;
    element.pause();
    element.currentTime = fromMs / 1000;
    stopAt.current = toMs;
    setChecking(highlight);
    void element.play();
  };

  const msAt = (clientX: number) => {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return 0;
    return ((clientX - box.left) / box.width) * durationMs;
  };

  const nearestCut = (ms: number) =>
    cuts.reduce((best, cut, i) => (Math.abs(cut - ms) < Math.abs(cuts[best] - ms) ? i : best), 0);

  const bars = peaks ?? placeholderPeaks(clipId, BARS);
  const percent = (ms: number) => `${Math.min(100, Math.max(0, (ms / durationMs) * 100))}%`;

  const cutName = (i: number) =>
    i === 0 ? t("cutBefore", { word: words[0] }) : i === words.length ? t("cutAfter", { word: words[words.length - 1] }) : t("cutBetween", { before: words[i - 1], after: words[i] });

  if (words.length === 0) return <p className="text-sm text-muted-foreground">{t("noWords")}</p>;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">{t("help")}</p>

      {/* Time runs left to right like the Latin words, in every interface language. */}
      <div dir="ltr" className="flex flex-col gap-2">
        <div className="relative h-8">
          {result?.map((w, i) => (
            <button
              key={i}
              type="button"
              onClick={() => play(w.startMs, w.endMs ?? durationMs, true)}
              aria-label={t("playWord", { word: w.word })}
              style={{ left: percent(w.startMs), width: percent((w.endMs ?? durationMs) - w.startMs) }}
              className={cn(
                "absolute top-0 flex h-8 min-w-0 items-center justify-center truncate rounded-md px-1 text-sm font-semibold ring-1 ring-border transition-colors hover:bg-accent",
                active === i && "bg-gold/50",
              )}
            >
              {w.word}
            </button>
          ))}
        </div>

        <div
          ref={track}
          role="group"
          aria-label={t("waveform")}
          className="relative h-28 touch-none select-none rounded-xl bg-muted/60"
          onPointerDown={(event) => {
            const ms = msAt(event.clientX);
            const index = nearestCut(ms);
            setCuts((current) => moveCut(current, index, ms, durationMs));
            setDragging(index);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (dragging === null) return;
            const ms = msAt(event.clientX);
            setCuts((current) => moveCut(current, dragging, ms, durationMs));
          }}
          onPointerUp={() => setDragging(null)}
          onPointerCancel={() => setDragging(null)}
        >
          <div aria-hidden className="absolute inset-x-0 inset-y-2 flex items-center gap-px px-px">
            {bars.map((peak, i) => {
              const ms = ((i + 0.5) / bars.length) * durationMs;
              const inside = cuts.length > 1 && ms >= cuts[0] && ms <= cuts[cuts.length - 1];
              return (
                <span
                  key={i}
                  className={cn("flex-1 rounded-full", inside ? "bg-primary/70" : "bg-muted-foreground/30")}
                  style={{ height: `${Math.max(4, peak * 100)}%` }}
                />
              );
            })}
          </div>

          {playhead !== null && <span aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 bg-gold" style={{ left: percent(playhead) }} />}

          {cuts.map((cut, i) => (
            <button
              key={i}
              type="button"
              role="slider"
              aria-label={cutName(i)}
              aria-valuemin={0}
              aria-valuemax={durationMs}
              aria-valuenow={cut}
              aria-valuetext={t("cutLabel", { number: i + 1, time: seconds(cut) })}
              onPointerDown={(event) => {
                event.stopPropagation();
                setDragging(i);
                track.current?.setPointerCapture(event.pointerId);
              }}
              onKeyDown={(event) => {
                const step = (event.shiftKey ? 5 : 1) * STEP_MS;
                const delta = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -step : event.key === "ArrowRight" || event.key === "ArrowUp" ? step : 0;
                if (!delta) return;
                event.preventDefault();
                setCuts((current) => moveCut(current, i, current[i] + delta, durationMs));
              }}
              style={{ left: percent(cut) }}
              className="group absolute inset-y-0 -ms-3 flex w-6 cursor-ew-resize justify-center focus-visible:outline-none"
            >
              <span
                className={cn(
                  "h-full w-1 rounded-full bg-destructive transition-transform group-hover:scale-x-150 group-focus-visible:scale-x-150 group-focus-visible:ring-2 group-focus-visible:ring-ring",
                  dragging === i && "scale-x-150",
                )}
              />
              <span className="absolute -bottom-6 whitespace-nowrap text-xs tabular-nums text-muted-foreground">{seconds(cut)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => play(0, null, true)} disabled={!result}>
          <PlayIcon aria-hidden />
          {t("check")}
        </Button>
        <Toggle variant="outline" pressed={slow} onPressedChange={setSlow} aria-label={t("slow")}>
          <SnailIcon aria-hidden />
          {t("slow")}
        </Toggle>
        <Button type="button" variant="ghost" disabled={!peaks} onClick={() => peaks && setCuts(suggestCuts(words, peaks, durationMs))}>
          <SparklesIcon aria-hidden />
          {t("reset")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button type="button" disabled={!result || pending} onClick={() => run(() => saveTimestamps(clipId, result), { success: t("saved"), onSuccess: onSaved })}>
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
