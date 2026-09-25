"use client";

import { AlertTriangleIcon, ArrowRightIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { getDirection } from "@/i18n/config";
import { playOnce } from "@/lib/audio/bus";
import type { RecordingPrompt } from "@/lib/contribute/prompts";
import { checkRecording, MAX_RECORDING_SECONDS, type RecordingIssue } from "@/lib/contribute/quality";
import { readScripts, toggleScript, type WritingScript } from "@/lib/contribute/scripts";
import { cardSlide } from "@/lib/motion";
import { safeStorage } from "@/lib/storage";
import { PromptCard } from "./prompt-card";
import { RecordButton } from "./record-button";
import { SessionStatus } from "./session-status";
import { SessionThanks } from "./session-thanks";
import { useSendQueue } from "./use-send-queue";
import { WrittenForm, type WrittenValues } from "./written-form";

const SCRIPTS_KEY = "tachawit:contribute-scripts";
const empty: WrittenValues = { latin: "", arabic: "", tifinagh: "", meaning: "" };

function storedScripts(): WritingScript[] {
  try {
    return readScripts(JSON.parse(safeStorage.get(SCRIPTS_KEY) ?? "null"));
  } catch {
    return readScripts(null);
  }
}

async function issueIn(blob: Blob): Promise<RecordingIssue | null> {
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    return checkRecording(buffer.getChannelData(0), buffer.sampleRate);
  } catch {
    return null;
  } finally {
    void context.close();
  }
}

/**
 * Word after word: see a meaning, record how you say it, optionally write it, move on. Recordings
 * are sent in the background. With no words waiting, the speaker records words of their choice.
 */
export function RecordingSession() {
  const t = useTranslations("Contribute");
  const rtl = getDirection(useLocale()) === "rtl";
  const recorder = useMediaRecorder(MAX_RECORDING_SECONDS, { noiseSuppression: false });
  const queue = useSendQueue();
  const [prompts, setPrompts] = useState<RecordingPrompt[] | null>(null);
  const [index, setIndex] = useState(0);
  const [ownWord, setOwnWord] = useState(false);
  const [written, setWritten] = useState<WrittenValues>(empty);
  const [scripts, setScripts] = useState<WritingScript[]>(storedScripts);
  const [checked, setChecked] = useState<{ blob: Blob; issue: RecordingIssue | null } | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/contribute/prompts")
      .then((response) => (response.ok ? (response.json() as Promise<{ prompts: RecordingPrompt[] }>) : { prompts: [] }))
      .catch(() => ({ prompts: [] }))
      .then((data) => alive && setPrompts(data.prompts));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const blob = recorder.blob;
    if (!blob) return;
    let alive = true;
    void issueIn(blob).then((issue) => alive && setChecked({ blob, issue }));
    return () => {
      alive = false;
    };
  }, [recorder.blob]);

  const prompt = !ownWord && prompts ? (prompts[index] ?? null) : null;
  const listDone = prompts !== null && index >= prompts.length;
  const issue = checked?.blob === recorder.blob ? checked.issue : null;

  const clearTake = () => {
    recorder.reset();
    setWritten(empty);
  };

  const next = () => {
    clearTake();
    if (prompt) setIndex((i) => i + 1);
  };

  const send = () => {
    if (!recorder.blob) return;
    const form = new FormData();
    form.set("audio", recorder.blob, "recording");
    for (const script of scripts) form.set(`text_${script}`, written[script]);
    if (!prompt) form.set("meaning", written.meaning);
    form.set("prompt_entry_id", prompt?.id ?? "");
    queue.add(form);
    next();
  };

  const pickScript = (script: WritingScript) =>
    setScripts((current) => {
      const updated = toggleScript(current, script);
      safeStorage.set(SCRIPTS_KEY, JSON.stringify(updated));
      return updated;
    });

  if (finished) return <SessionThanks sent={queue.sent} pending={queue.pending} onMore={() => setFinished(false)} />;

  if (!recorder.hydrated) return null;
  if (!recorder.supported) return <p className="rounded-2xl bg-muted/50 p-4 text-sm">{t("unsupported")}</p>;

  const recording = recorder.state === "recording";

  return (
    <div className="flex flex-col gap-6">
      <SessionStatus queue={queue} onFinish={() => setFinished(true)} />

      <section className="relative flex flex-col gap-6 overflow-x-clip rounded-3xl bg-card p-5 shadow-soft ring-1 ring-border">
        {prompts === null ? (
          <p className="py-6 text-center text-muted-foreground" role="status">
            {t("loadingWords")}
          </p>
        ) : (
          <AnimatePresence initial={false} mode="popLayout" custom={rtl ? -1 : 1}>
            <motion.div key={prompt?.id ?? "own"} custom={rtl ? -1 : 1} variants={cardSlide} initial="enter" animate="center" exit="exit">
              {prompt ? (
                <PromptCard prompt={prompt} position={index + 1} total={prompts.length} onSkip={next} />
              ) : (
                <div className="flex flex-col gap-1 text-center">
                  <p className="text-xl font-semibold">{t("ownWordTitle")}</p>
                  <p className="text-sm text-muted-foreground">{listDone && !ownWord ? t("noPrompts") : t("ownWordLead")}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {recorder.blob && !recording ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" size="lg" onClick={() => recorder.url && void playOnce(recorder.url)}>
                <PlayIcon aria-hidden />
                {t("listen")}
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={recorder.reset}>
                <RotateCcwIcon aria-hidden />
                {t("redo")}
              </Button>
            </div>
            {issue && (
              <p role="status" className="flex items-start gap-2 rounded-lg bg-gold/15 px-3 py-2 text-sm">
                <AlertTriangleIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
                {t(`issues.${issue}`)}
              </p>
            )}
          </div>
        ) : (
          <RecordButton
            recording={recording}
            requesting={recorder.state === "requesting"}
            stream={recorder.stream}
            onStart={() => void recorder.start()}
            onStop={recorder.stop}
          />
        )}
        {recorder.state === "denied" && (
          <p role="alert" className="text-center text-sm text-destructive">
            {t("micDenied")}
          </p>
        )}

        <WrittenForm scripts={scripts} onToggleScript={pickScript} values={written} onChange={setWritten} withMeaning={!prompt} />

        <Button type="button" size="lg" onClick={send} disabled={!recorder.blob || recording} className="h-12 rounded-xl text-base">
          {prompt ? t("next") : t("send")}
          <ArrowRightIcon aria-hidden className="rtl:-scale-x-100" />
        </Button>
      </section>

      {prompts !== null && prompts.length > index && (
        <Button
          type="button"
          variant="link"
          className="self-center"
          onClick={() => {
            clearTake();
            setOwnWord((own) => !own);
          }}
        >
          {ownWord ? t("backToList") : t("ownWord")}
        </Button>
      )}
    </div>
  );
}
