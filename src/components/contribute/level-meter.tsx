"use client";

import { useEffect, useRef } from "react";

const BARS = 5;

/** Live microphone level while recording, so the speaker sees they are being heard. */
export function LevelMeter({ stream }: { stream: MediaStream }) {
  const bars = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let frame = 0;
    const draw = () => {
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, s) => sum + s * s, 0) / samples.length);
      const level = Math.min(1, rms * 6);
      bars.current.forEach((bar, i) => {
        const shape = 1 - Math.abs(i - (BARS - 1) / 2) / BARS;
        if (bar) bar.style.transform = `scaleY(${Math.max(0.15, level * shape * 1.4)})`;
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      void context.close();
    };
  }, [stream]);

  return (
    <span aria-hidden className="flex h-6 items-center gap-1">
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          className="h-full w-1.5 origin-center scale-y-[0.15] rounded-full bg-destructive"
        />
      ))}
    </span>
  );
}
