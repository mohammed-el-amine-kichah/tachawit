import type { ReactNode } from "react";
import { staggerStepMs } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Pure CSS, so content is visible without JavaScript and never waits for hydration.
const entranceClassName =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:ease-out motion-safe:fill-mode-both";

/** Fades an element up on first paint; `index` staggers siblings. Skipped for reduced motion. */
export function Entrance({
  index = 0,
  as: Tag = "div",
  className,
  children,
}: {
  index?: number;
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn(entranceClassName, className)} style={{ animationDelay: `${index * staggerStepMs}ms` }}>
      {children}
    </Tag>
  );
}
