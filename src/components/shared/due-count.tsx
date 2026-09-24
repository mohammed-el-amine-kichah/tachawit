"use client";

import { useMemo } from "react";
import { useProgress } from "@/components/progress/progress-provider";
import { useHydrated } from "@/hooks/use-hydrated";
import { dueEntryIds } from "@/lib/srs/sm2";

/** Number of words due for review, or 0 until progress is available in the browser. */
export function useDueCount(): number {
  const hydrated = useHydrated();
  const { snapshot, ready } = useProgress();
  return useMemo(
    () => (hydrated && ready ? dueEntryIds(snapshot.srs, new Date(), 99).length : 0),
    [hydrated, ready, snapshot.srs],
  );
}

export function DueBadge({ className }: { className?: string }) {
  const count = useDueCount();
  if (count === 0) return null;
  return (
    <span className={className} aria-hidden>
      {count > 9 ? "9+" : count}
    </span>
  );
}
