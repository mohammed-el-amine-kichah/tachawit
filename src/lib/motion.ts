import type { Transition, Variants } from "motion/react";

// Shared motion vocabulary. Interaction feedback stays under 200ms; only celebrations run longer.
// <MotionConfig reducedMotion="user"> (see Providers) turns transforms off for reduced-motion users.
// Entrances of server-rendered content use CSS (<Entrance>) so nothing is hidden until hydration.

export const durations = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
  draw: 0.9,
} as const;

export const easings = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const springs = {
  press: { type: "spring", stiffness: 520, damping: 32 },
  pop: { type: "spring", stiffness: 380, damping: 18 },
} as const satisfies Record<string, Transition>;

/** Delay between siblings of a staggered entrance (see <Entrance>). */
export const staggerStepMs = 70;

export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: staggerStepMs / 1000, delayChildren: 0.05 } },
};

/** Micro-interaction for tappable cards and nodes. */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.97 },
  transition: springs.press,
} as const;

/** Stroke drawing itself. The transition is separate so reduced-motion users can get an instant one. */
export const drawStroke: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1 },
};

export const drawStrokeTransition: Transition = { duration: durations.draw, ease: easings.inOut };

export const instant: Transition = { duration: 0 };
