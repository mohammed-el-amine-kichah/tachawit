"use client";

import { motion, useReducedMotion } from "motion/react";
import { seededRandom } from "@/lib/random";
import { cn } from "@/lib/utils";

const COLORS = ["bg-primary", "bg-gold", "bg-success", "bg-secondary", "bg-accent-foreground"];
const random = seededRandom(7);
const PIECES = Array.from({ length: 36 }, (_, i) => ({
  left: random() * 100,
  delay: random() * 0.5,
  duration: 1.8 + random() * 1.4,
  drift: (random() - 0.5) * 160,
  rotate: (random() - 0.5) * 720,
  size: 6 + random() * 8,
  round: i % 3 === 0,
  color: COLORS[i % COLORS.length],
}));

/** A one-shot shower of woven-colour confetti. Skipped entirely for reduced motion. */
export function Confetti() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {PIECES.map((piece, i) => (
        <motion.span
          key={i}
          className={cn("absolute top-0", piece.color, piece.round ? "rounded-full" : "rounded-sm")}
          style={{ left: `${piece.left}%`, width: piece.size, height: piece.round ? piece.size : piece.size * 1.6 }}
          initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", x: piece.drift, rotate: piece.rotate, opacity: [1, 1, 0.8, 0] }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
