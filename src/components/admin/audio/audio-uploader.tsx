"use client";

import { MicIcon, PauseIcon, PlayIcon, SquareIcon, UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { Link } from "@/i18n/navigation";
import { clampTrim } from "@/lib/audio/ffmpeg";
import { computePeaks } from "@/lib/audio/peaks";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** The signed-in admin's own speaker profile: recordings added here are credited to them. */
export type OwnVoice = { name: string; consent: boolean };

const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
};
const MAX_BYTES = 25 * 1024 * 1024;

/** Browsers report some types oddly (".m4a" as "", recordings with codec parameters). */
function audioType(file: Blob & { name?: string }): string | null {
  const base = file.type.split(";")[0].trim();
  if (EXTENSIONS[base]) return base;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  const byExt = Object.entries(EXTENSIONS).find(([, e]) => e === ext)?.[0];
  return byExt ?? null;
}

type Loaded = { blob: Blob; type: string; buffer: AudioBuffer; peaks: number[]; durationMs: number };

/**
 * Add a recording: drop or pick a file, or record in the browser; trim it. It is credited to the admin
 * who adds it, as the speaker.
 * The original is kept privately and a web version (plus a slow one) is made on the server.
 */
export function AudioUploader({ entryId, voice, onDone }: { entryId: string | null; voice: OwnVoice | null; onDone?: () => void }) {
  const t = useTranslations("Admin.audio");
  const router = useRouter();
  const recorder = useMediaRecorder(30);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [trim, setTrim] = useState({ startMs: 0, endMs: 0 });
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const context = useRef<AudioContext | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async (blob: Blob & { name?: string }) => {
    const type = audioType(blob);
    if (!type) return void toast.error(t("unsupportedType"));
    if (blob.size > MAX_BYTES) return void toast.error(t("tooLarge"));
    try {
      context.current ??= new AudioContext();
      const buffer = await context.current.decodeAudioData(await blob.arrayBuffer());
      const durationMs = Math.round(buffer.duration * 1000);
      setLoaded({ blob, type, buffer, durationMs, peaks: computePeaks(buffer.getChannelData(0), 120) });
      setTrim({ startMs: 0, endMs: durationMs });
    } catch {
      toast.error(t("unreadable"));
    }
  };

  useEffect(() => {
    if (recorder.state === "recorded" && recorder.blob) void load(recorder.blob);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per new recording
  }, [recorder.state, recorder.blob]);

  useEffect(() => () => void context.current?.close(), []);

  const stopPreview = () => {
    source.current?.stop();
    source.current = null;
    setPreviewing(false);
  };

  const preview = () => {
    if (!loaded || !context.current) return;
    if (previewing) return stopPreview();
    const node = context.current.createBufferSource();
    node.buffer = loaded.buffer;
    node.connect(context.current.destination);
    node.onended = () => setPreviewing(false);
    node.start(0, trim.startMs / 1000, (trim.endMs - trim.startMs) / 1000);
    source.current = node;
    setPreviewing(true);
  };

  const setBound = (key: "startMs" | "endMs", value: number) => {
    if (!loaded) return;
    const next = { ...trim, [key]: value };
    setTrim(clampTrim(next.startMs, next.endMs, loaded.durationMs));
  };

  const save = async () => {
    if (!loaded) return;
    setBusy(true);
    stopPreview();
    try {
      const originalPath = `uploads/${crypto.randomUUID()}.${EXTENSIONS[loaded.type]}`;
      const upload = await createBrowserSupabase().storage.from("audio-originals").upload(originalPath, loaded.blob, { contentType: loaded.type });
      if (upload.error) throw new Error("upload");
      const response = await fetch("/api/admin/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalPath, ...trim, durationMs: loaded.durationMs, entryId }),
      });
      if (!response.ok) throw new Error(((await response.json().catch(() => ({}))) as { error?: string }).error ?? "failed");
      toast.success(t("added"));
      setLoaded(null);
      recorder.reset();
      router.refresh();
      onDone?.();
    } catch (error) {
      toast.error((error as Error).message === "conversion" ? t("conversionFailed") : t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (!voice) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">{t("needVoice")}</p>
        <Button asChild variant="outline">
          <Link href="/profile">{t("setUpVoice")}</Link>
        </Button>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInput.current?.click()}
          onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && fileInput.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void load(file);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
          )}
        >
          <UploadIcon aria-hidden className="size-8 text-primary" />
          <p className="font-medium">{t("dropHere")}</p>
          <p className="text-sm text-muted-foreground">{t("formats")}</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void load(file);
            event.target.value = "";
          }}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("or")}
          <span className="h-px flex-1 bg-border" />
        </div>
        {recorder.supported ? (
          recorder.state === "recording" ? (
            <Button variant="secondary" size="lg" onClick={recorder.stop}>
              <SquareIcon aria-hidden className="fill-current" />
              {t("stopRecording")}
              <span aria-hidden className="size-2 rounded-full bg-destructive motion-safe:animate-pulse" />
            </Button>
          ) : (
            <Button variant="outline" size="lg" onClick={() => void recorder.start()} disabled={recorder.state === "requesting"}>
              <MicIcon aria-hidden />
              {t("record")}
            </Button>
          )
        ) : (
          <p className="text-sm text-muted-foreground">{t("recordUnsupported")}</p>
        )}
        {recorder.state === "denied" && <p className="text-sm text-destructive">{t("micDenied")}</p>}
        <p className="text-xs text-muted-foreground">{t("ownVoiceOnly")}</p>
      </div>
    );
  }

  const startPct = (trim.startMs / loaded.durationMs) * 100;
  const endPct = (trim.endMs / loaded.durationMs) * 100;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative h-24 rounded-xl bg-muted/60 px-2" aria-hidden>
        <div className="flex h-full items-center gap-px" dir="ltr">
          {loaded.peaks.map((peak, i) => {
            const inside = (i / loaded.peaks.length) * 100 >= startPct && (i / loaded.peaks.length) * 100 <= endPct;
            return <span key={i} className={cn("w-full rounded-full", inside ? "bg-primary" : "bg-muted-foreground/25")} style={{ height: `${Math.max(4, peak * 100)}%` }} />;
          })}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2" dir="ltr">
        <div className="flex flex-col gap-1">
          <Label htmlFor="trim-start">
            {t("trimStart")} · {(trim.startMs / 1000).toFixed(2)}s
          </Label>
          <input id="trim-start" type="range" min={0} max={loaded.durationMs} step={10} value={trim.startMs} onChange={(e) => setBound("startMs", Number(e.target.value))} className="accent-[var(--primary)]" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="trim-end">
            {t("trimEnd")} · {(trim.endMs / 1000).toFixed(2)}s
          </Label>
          <input id="trim-end" type="range" min={0} max={loaded.durationMs} step={10} value={trim.endMs} onChange={(e) => setBound("endMs", Number(e.target.value))} className="accent-[var(--primary)]" />
        </div>
      </div>
      <Button type="button" variant="outline" onClick={preview} className="self-start">
        {previewing ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
        {t("previewTrim")}
      </Button>

      <div className="flex flex-col gap-1 text-sm">
        <p className="font-medium">{t("recordingAs", { name: voice.name })}</p>
        {!voice.consent && <p className="text-muted-foreground">{t("noConsentHint")}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void save()} disabled={busy}>
          {busy ? t("processing") : t("save")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            stopPreview();
            setLoaded(null);
            recorder.reset();
          }}
        >
          {t("startOver")}
        </Button>
      </div>
    </div>
  );
}
