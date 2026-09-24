"use client";

import { useMotionValue, type MotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { claimAudio, releaseAudio } from "@/lib/audio/bus";
import type { AudioInfo } from "@/lib/lesson/view";

const SLOW_RATE = 0.7;

export type AudioPlayer = {
  available: boolean;
  playing: boolean;
  slow: boolean;
  failed: boolean;
  /** Playback position on the clip's normal-speed timeline, in ms (matches word timestamps). */
  time: MotionValue<number>;
  /** Playback position from 0 to 1. */
  progress: MotionValue<number>;
  play: () => void;
  toggle: () => void;
  setSlow: (slow: boolean) => void;
  playSegment: (startMs: number, endMs: number) => void;
  seek: (fraction: number) => void;
};

/**
 * Plays one clip. Slow mode uses the clip's slow recording when there is one,
 * otherwise pitch-preserving playback at 0.7×.
 */
export function useAudioPlayer(audio: AudioInfo | null): AudioPlayer {
  const elementRef = useRef<HTMLAudioElement | null>(null);
  const stopAtRef = useRef<number | null>(null);
  const factorRef = useRef(1);
  const resumeRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlowState] = useState(false);
  const [failed, setFailed] = useState(false);
  const time = useMotionValue(0);
  const progress = useMotionValue(0);

  const slowFile = slow && audio?.slowUrl ? audio.slowUrl : null;
  const src = slowFile ?? audio?.url ?? null;
  const expectedMs = audio?.durationMs ?? null;

  useEffect(() => {
    if (!src) return;
    const element = new Audio();
    element.preload = "auto";
    element.src = src;
    elementRef.current = element;
    factorRef.current = 1;
    let frame = 0;

    const toClipMs = () => (element.currentTime * 1000) / factorRef.current;
    const tick = () => {
      const ms = toClipMs();
      time.set(ms);
      progress.set(element.duration ? element.currentTime / element.duration : 0);
      if (stopAtRef.current !== null && ms >= stopAtRef.current) {
        stopAtRef.current = null;
        element.pause();
      }
      if (!element.paused) frame = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      claimAudio(element);
      setPlaying(true);
      frame = requestAnimationFrame(tick);
    };
    const onPause = () => {
      cancelAnimationFrame(frame);
      setPlaying(false);
    };
    const onEnded = () => {
      cancelAnimationFrame(frame);
      setPlaying(false);
      time.set(0);
      progress.set(0);
    };
    const onMetadata = () => {
      if (slowFile && expectedMs) factorRef.current = (element.duration * 1000) / expectedMs;
      if (resumeRef.current) {
        resumeRef.current = false;
        element.play().catch(() => {});
      }
    };
    const onError = () => setFailed(true);

    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    element.addEventListener("ended", onEnded);
    element.addEventListener("loadedmetadata", onMetadata);
    element.addEventListener("error", onError);
    return () => {
      cancelAnimationFrame(frame);
      element.pause();
      releaseAudio(element);
      element.removeAttribute("src");
      element.load();
      elementRef.current = null;
    };
  }, [src, slowFile, expectedMs, time, progress]);

  useEffect(() => {
    const element = elementRef.current;
    if (element) element.playbackRate = slow && !slowFile ? SLOW_RATE : 1;
  }, [slow, slowFile, src]);

  const play = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;
    stopAtRef.current = null;
    if (element.ended) element.currentTime = 0;
    element.play().catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;
    if (element.paused) play();
    else element.pause();
  }, [play]);

  const setSlow = useCallback(
    (next: boolean) => {
      const element = elementRef.current;
      // Switching to or from a separate slow recording reloads the clip; keep playing if it was.
      resumeRef.current = Boolean(element && !element.paused && audio?.slowUrl);
      setSlowState(next);
    },
    [audio?.slowUrl],
  );

  const playSegment = useCallback((startMs: number, endMs: number) => {
    const element = elementRef.current;
    if (!element) return;
    element.currentTime = (startMs * factorRef.current) / 1000;
    stopAtRef.current = endMs;
    element.play().catch(() => {});
  }, []);

  const seek = useCallback((fraction: number) => {
    const element = elementRef.current;
    if (!element?.duration) return;
    element.currentTime = Math.min(1, Math.max(0, fraction)) * element.duration;
    progress.set(fraction);
  }, [progress]);

  return {
    available: Boolean(audio) && !failed,
    playing,
    slow,
    failed,
    time,
    progress,
    play,
    toggle,
    setSlow,
    playSegment,
    seek,
  };
}
