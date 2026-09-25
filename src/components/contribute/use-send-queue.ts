"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitRecording, type RecordingResult } from "@/app/actions/contribute";

export type SendError = Extract<RecordingResult, { ok: false }>["error"];

type Item = { id: number; form: FormData; status: "waiting" | "sending" | "failed"; tries: number };

const AUTO_RETRIES = 2;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends recordings one after another in the background, so the speaker can move on to the next
 * word at once. Connection failures are retried; the page warns before closing while any remain.
 */
export function useSendQueue() {
  const items = useRef<Item[]>([]);
  const running = useRef(false);
  const nextId = useRef(0);
  const [snapshot, setSnapshot] = useState<readonly Item[]>([]);
  const [sent, setSent] = useState(0);
  const [error, setError] = useState<SendError | null>(null);

  const update = useCallback((id: number, patch: Partial<Item> | null) => {
    items.current = patch === null ? items.current.filter((i) => i.id !== id) : items.current.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setSnapshot(items.current);
  }, []);

  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (let item = items.current.find((i) => i.status === "waiting"); item; item = items.current.find((i) => i.status === "waiting")) {
        update(item.id, { status: "sending" });
        let result: RecordingResult;
        try {
          result = await submitRecording(item.form);
        } catch {
          result = { ok: false, error: "failed" };
        }
        if (result.ok) {
          update(item.id, null);
          setSent((n) => n + 1);
          setError(null);
        } else if (result.error === "failed" && item.tries < AUTO_RETRIES) {
          await wait(2000 * (item.tries + 1));
          update(item.id, { status: "waiting", tries: item.tries + 1 });
        } else {
          update(item.id, { status: "failed" });
          setError(result.error);
        }
      }
    } finally {
      running.current = false;
    }
  }, [update]);

  const add = useCallback(
    (form: FormData) => {
      items.current = [...items.current, { id: nextId.current++, form, status: "waiting", tries: 0 }];
      setSnapshot(items.current);
      void pump();
    },
    [pump],
  );

  const retry = useCallback(() => {
    items.current = items.current.map((i) => (i.status === "failed" ? { ...i, status: "waiting", tries: 0 } : i));
    setSnapshot(items.current);
    setError(null);
    void pump();
  }, [pump]);

  const pending = snapshot.filter((i) => i.status !== "failed").length;
  const failed = snapshot.length - pending;

  useEffect(() => {
    if (snapshot.length === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [snapshot.length]);

  return { add, retry, sent, pending, failed, error };
}
