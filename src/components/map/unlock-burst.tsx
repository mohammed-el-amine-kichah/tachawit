"use client";

import { motion } from "motion/react";

const RAYS = 10;

/** A ring and a spray of sparks when a node opens up. */
export function UnlockBurst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <motion.span
        className="absolute inset-0 rounded-full border-4 border-gold"
        initial={{ scale: 0.6, opacity: 1 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
      />
      {Array.from({ length: RAYS }, (_, i) => {
        const angle = (i / RAYS) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 -ms-1 -mt-1 size-2 rounded-full bg-gold"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: Math.cos(angle) * 64, y: Math.sin(angle) * 64, opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, delay: 1.55, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}
