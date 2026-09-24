"use client";

import { useEffect, useState } from "react";
import { computePeaks, placeholderPeaks } from "@/lib/audio/peaks";

const cache = new Map<string, Promise<number[]>>();
let decoder: OfflineAudioContext | null = null;

async function decodePeaks(url: string, bars: number): Promise<number[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
  decoder ??= new OfflineAudioContext(1, 1, 44100);
  const buffer = await decoder.decodeAudioData(await response.arrayBuffer());
  return computePeaks(buffer.getChannelData(0), bars);
}

/** The clip's real waveform, with a stand-in shown until it has been decoded. */
export function usePeaks(url: string | null, bars: number): number[] {
  const [loaded, setLoaded] = useState<{ key: string; peaks: number[] } | null>(null);
  const key = `${url}|${bars}`;

  useEffect(() => {
    if (!url) return;
    let alive = true;
    if (!cache.has(key)) cache.set(key, decodePeaks(url, bars));
    cache
      .get(key)!
      .then((peaks) => alive && setLoaded({ key, peaks }))
      .catch(() => cache.delete(key));
    return () => {
      alive = false;
    };
  }, [url, bars, key]);

  return loaded?.key === key ? loaded.peaks : placeholderPeaks(url ?? "silence", bars);
}
