"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHydrated } from "./use-hydrated";

export type RecorderState = "idle" | "requesting" | "recording" | "recorded" | "denied";

/** Microphone recording with MediaRecorder: start, stop (or auto-stop), and the resulting blob. */
export function useMediaRecorder(maxSeconds: number) {
  const hydrated = useHydrated();
  const [state, setState] = useState<RecorderState>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
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

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const result = new Blob(chunks, { type: recorder.mimeType });
        setBlob(result);
        setUrl(URL.createObjectURL(result));
        setState("recorded");
      };
      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
      timerRef.current = setTimeout(stop, maxSeconds * 1000);
    } catch {
      setState("denied");
    }
  }, [maxSeconds, stop]);

  const reset = useCallback(() => {
    setBlob(null);
    setUrl(null);
    setState("idle");
  }, []);

  return { hydrated, supported, state, blob, url, start, stop, reset };
}
