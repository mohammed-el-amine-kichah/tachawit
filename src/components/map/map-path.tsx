"use client";

import { motion } from "motion/react";
import { durations, easings } from "@/lib/motion";

export type PathSegment = { d: string; walked: boolean; drawIn: boolean };

/**
 * The winding trail between nodes. Walked segments are solid; the rest is a dotted track.
 * Uses non-scaling strokes so the trail keeps its weight when the column stretches.
 */
export function MapPath({ width, height, segments }: { width: number; height: number; segments: PathSegment[] }) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
    >
      {segments.map((segment, index) => (
        <path
          key={`track-${index}`}
          d={segment.d}
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeWidth={10}
          strokeDasharray="1 18"
          className="stroke-map-path"
        />
      ))}
      {segments.map((segment, index) =>
        segment.walked ? (
          <motion.path
            key={`walked-${index}`}
            d={segment.d}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeWidth={12}
            strokeDasharray="1600 1600"
            className="stroke-primary"
            initial={segment.drawIn ? { strokeDashoffset: 1600 } : false}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: durations.draw, ease: easings.inOut, delay: 0.9 }}
          />
        ) : null,
      )}
    </svg>
  );
}
