"use client";

import { motion, useReducedMotion } from "motion/react";
import { drawStroke, drawStrokeTransition, instant, staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { zMarkPaths } from "./z-mark";

/** The ⵣ mark drawing itself stroke by stroke; appears at once for reduced-motion users. */
export function AnimatedZMark({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-16", className)}
      aria-hidden
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
    >
      {zMarkPaths.map((d) => (
        <motion.path key={d} d={d} variants={drawStroke} transition={reduceMotion ? instant : drawStrokeTransition} />
      ))}
    </motion.svg>
  );
}
