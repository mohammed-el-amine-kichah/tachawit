"use client";

import { createContext, use, useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { localProgressStore } from "@/lib/progress/local-store";
import { applyLevelResult, type LevelResultInput, type ProgressSnapshot } from "@/lib/progress/snapshot";

type ProgressContextValue = {
  snapshot: ProgressSnapshot;
  /** False until the learner's saved progress has been loaded in the browser. */
  ready: boolean;
  recordLevel: (input: LevelResultInput) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    localProgressStore.subscribe,
    localProgressStore.getSnapshot,
    localProgressStore.getServerSnapshot,
  );
  const ready = useHydrated();

  const recordLevel = useCallback((input: LevelResultInput) => {
    localProgressStore.update((current) => applyLevelResult(current, input));
  }, []);

  const value = useMemo(() => ({ snapshot, ready, recordLevel }), [snapshot, ready, recordLevel]);
  return <ProgressContext value={value}>{children}</ProgressContext>;
}

export function useProgress(): ProgressContextValue {
  const value = use(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside <ProgressProvider>");
  return value;
}
