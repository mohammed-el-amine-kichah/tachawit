"use client";

import { createContext, use, useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { localProgressStore } from "@/lib/progress/local-store";
import { applyLevelCompletion, type LevelCompletion, type ProgressSnapshot } from "@/lib/progress/snapshot";

type ProgressContextValue = {
  snapshot: ProgressSnapshot;
  /** False until the learner's saved progress has been loaded in the browser. */
  ready: boolean;
  completeLevel: (completion: Omit<LevelCompletion, "completedAt">) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    localProgressStore.subscribe,
    localProgressStore.getSnapshot,
    localProgressStore.getServerSnapshot,
  );
  const ready = useHydrated();

  const completeLevel = useCallback((completion: Omit<LevelCompletion, "completedAt">) => {
    const completedAt = new Date().toISOString();
    localProgressStore.update((current) => applyLevelCompletion(current, { ...completion, completedAt }));
  }, []);

  const value = useMemo(() => ({ snapshot, ready, completeLevel }), [snapshot, ready, completeLevel]);
  return <ProgressContext value={value}>{children}</ProgressContext>;
}

export function useProgress(): ProgressContextValue {
  const value = use(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside <ProgressProvider>");
  return value;
}
