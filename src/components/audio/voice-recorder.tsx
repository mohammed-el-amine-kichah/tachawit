"use client";

import { MicIcon, PlayIcon, RotateCcwIcon, SquareIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { playOnce } from "@/lib/audio/bus";

const MAX_SECONDS = 10;

type State = "idle" | "requesting" | "recording" | "recorded" | "denied";

/** Record yourself and listen back next to the native speaker. Nothing is uploaded or scored. */
export function VoiceRecorder({ modelUrl, onRecorded }: { modelUrl: string | null; onRecorded?: () => void }) {
  const t = useTranslations("Recorder");
  const hydrated = useHydrated();
  const [state, setState] = useState<State>("idle");
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supported = hydrated && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );
  useEffect(() => () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  }, [recordingUrl]);

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const start = async () => {
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecordingUrl(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })));
        setState("recorded");
        onRecorded?.();
      };
      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
      timerRef.current = setTimeout(stop, MAX_SECONDS * 1000);
    } catch {
      setState("denied");
    }
  };

  const compare = async () => {
    if (modelUrl) await playOnce(modelUrl);
    if (recordingUrl) await playOnce(recordingUrl);
  };

  if (!hydrated) return null;
  if (!supported) return <p className="text-center text-sm text-muted-foreground">{t("unsupported")}</p>;
  if (state === "denied") return <p className="text-center text-sm text-muted-foreground">{t("denied")}</p>;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2" aria-live="polite">
      {state === "recording" ? (
        <Button size="lg" variant="secondary" onClick={stop} className="h-11 rounded-full px-5">
          <SquareIcon aria-hidden className="fill-current" />
          {t("stop")}
          <span aria-hidden className="size-2 rounded-full bg-destructive motion-safe:animate-pulse" />
        </Button>
      ) : state === "recorded" && recordingUrl ? (
        <>
          <Button size="lg" variant="outline" onClick={() => void playOnce(recordingUrl)} className="h-11 rounded-full px-4">
            <PlayIcon aria-hidden />
            {t("playMine")}
          </Button>
          {modelUrl && (
            <Button size="lg" variant="outline" onClick={() => void compare()} className="h-11 rounded-full px-4">
              <UsersIcon aria-hidden />
              {t("compare")}
            </Button>
          )}
          <Button size="lg" variant="ghost" onClick={() => void start()} className="h-11 rounded-full px-4">
            <RotateCcwIcon aria-hidden />
            {t("again")}
          </Button>
        </>
      ) : (
        <Button size="lg" variant="outline" onClick={() => void start()} disabled={state === "requesting"} className="h-11 rounded-full px-5">
          <MicIcon aria-hidden />
          {t("record")}
        </Button>
      )}
    </div>
  );
}
