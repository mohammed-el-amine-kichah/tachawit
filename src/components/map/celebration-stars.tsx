"use client";

import { StarIcon } from "lucide-react";
import { motion } from "motion/react";
import { easings } from "@/lib/motion";

/** Stars that fly down into a node that was just completed. Purely decorative, never blocks input. */
export function CelebrationStars({ count }: { count: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2"
          initial={{ x: (i - (count - 1) / 2) * 70, y: -220, scale: 2.2, opacity: 0, rotate: -40 }}
          animate={{ x: 0, y: 0, scale: 0.5, opacity: [0, 1, 1, 0], rotate: 0 }}
          transition={{ duration: 0.85, delay: 0.1 + i * 0.12, ease: easings.out }}
        >
          <StarIcon className="-ms-4 -mt-4 size-8 fill-gold stroke-gold-foreground/40" />
        </motion.span>
      ))}
    </span>
  );
}
