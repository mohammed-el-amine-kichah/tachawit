"use client";

import { MicIcon, PlayIcon, RotateCcwIcon, SquareIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { playOnce } from "@/lib/audio/bus";

/** Record yourself and listen back next to the native speaker. Nothing is uploaded or scored. */
export function VoiceRecorder({ modelUrl }: { modelUrl: string | null }) {
  const t = useTranslations("Recorder");
  const recorder = useMediaRecorder(10);

  const compare = async () => {
    if (modelUrl) await playOnce(modelUrl);
    if (recorder.url) await playOnce(recorder.url);
  };

  if (!recorder.hydrated) return null;
  if (!recorder.supported) return <p className="text-center text-sm text-muted-foreground">{t("unsupported")}</p>;
  if (recorder.state === "denied") return <p className="text-center text-sm text-muted-foreground">{t("denied")}</p>;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2" aria-live="polite">
      {recorder.state === "recording" ? (
        <Button size="lg" variant="secondary" onClick={recorder.stop} className="h-11 rounded-full px-5">
          <SquareIcon aria-hidden className="fill-current" />
          {t("stop")}
          <span aria-hidden className="size-2 rounded-full bg-destructive motion-safe:animate-pulse" />
        </Button>
      ) : recorder.state === "recorded" && recorder.url ? (
        <>
          <Button size="lg" variant="outline" onClick={() => void playOnce(recorder.url!)} className="h-11 rounded-full px-4">
            <PlayIcon aria-hidden />
            {t("playMine")}
          </Button>
          {modelUrl && (
            <Button size="lg" variant="outline" onClick={() => void compare()} className="h-11 rounded-full px-4">
              <UsersIcon aria-hidden />
              {t("compare")}
            </Button>
          )}
          <Button size="lg" variant="ghost" onClick={() => void recorder.start()} className="h-11 rounded-full px-4">
            <RotateCcwIcon aria-hidden />
            {t("again")}
          </Button>
        </>
      ) : (
        <Button
          size="lg"
          variant="outline"
          onClick={() => void recorder.start()}
          disabled={recorder.state === "requesting"}
          className="h-11 rounded-full px-5"
        >
          <MicIcon aria-hidden />
          {t("record")}
        </Button>
      )}
    </div>
  );
}
