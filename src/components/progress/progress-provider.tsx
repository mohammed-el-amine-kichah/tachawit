"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { localProgressStore } from "@/lib/progress/local-store";
import {
  applyLevelCompletion,
  applyReview,
  type LevelCompletion,
  type ProgressSnapshot,
  type ReviewResult,
} from "@/lib/progress/snapshot";
import { localDate } from "@/lib/progress/streak";
import { syncProgress } from "@/lib/progress/sync";

// Loaded on first use, so guests never download the Supabase client.
const browserSupabase = () => import("@/lib/supabase/client").then((module) => module.createBrowserSupabase());

type CompletionInput = Omit<LevelCompletion, "completedAt" | "today">;
type ReviewInput = Pick<ReviewResult, "grades" | "xp">;

type ProgressContextValue = {
  snapshot: ProgressSnapshot;
  /** False until the learner's saved progress is available in the browser. */
  ready: boolean;
  signedIn: boolean;
  completeLevel: (completion: CompletionInput) => void;
  recordReview: (review: ReviewInput) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function hasGuestProgress(snapshot: ProgressSnapshot): boolean {
  return Object.keys(snapshot.levels).length > 0 || Object.keys(snapshot.srs).length > 0 || snapshot.xp > 0;
}

/**
 * Guests keep progress in localStorage. Signed-in learners start from their account snapshot
 * (loaded on the server), update it optimistically and sync to Supabase through an outbox.
 * On sign-in, guest progress on this device is merged into the account once.
 */
export function ProgressProvider({
  account,
  children,
}: {
  account: { userId: string; snapshot: ProgressSnapshot } | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const guest = useSyncExternalStore(localProgressStore.subscribe, localProgressStore.getSnapshot, localProgressStore.getServerSnapshot);
  const serverSnapshot = account?.snapshot ?? null;
  const [accountSnapshot, setAccountSnapshot] = useState(serverSnapshot);
  const [loadedFrom, setLoadedFrom] = useState(serverSnapshot);
  const latest = useRef(serverSnapshot);
  const merging = useRef(false);
  const userId = account?.userId ?? null;

  // A fresh snapshot from the server (after sign-in or a refresh) replaces the local one.
  if (serverSnapshot !== loadedFrom) {
    setLoadedFrom(serverSnapshot);
    setAccountSnapshot(serverSnapshot);
  }

  const commit = useCallback((next: ProgressSnapshot) => {
    latest.current = next;
    setAccountSnapshot(next);
  }, []);

  useEffect(() => {
    latest.current = accountSnapshot;
  }, [accountSnapshot]);

  // Merge guest progress into a freshly signed-in account, then reload it from the server.
  useEffect(() => {
    if (!userId || !hydrated || merging.current || !hasGuestProgress(guest)) return;
    merging.current = true;
    void browserSupabase()
      .then((supabase) => supabase.rpc("merge_guest_progress", { p_snapshot: guest, p_today: localDate() }))
      .then(({ error }) => {
        if (error) throw error;
        localProgressStore.clear();
        router.refresh();
      })
      .catch(() => {
        merging.current = false;
      });
  }, [userId, hydrated, guest, router]);

  // Send anything that was saved while offline, now and whenever the connection returns.
  useEffect(() => {
    if (!userId) return;
    const flush = () => void syncProgress(browserSupabase, userId);
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [userId]);

  const completeLevel = useCallback(
    (completion: CompletionInput) => {
      const full = { ...completion, completedAt: new Date().toISOString(), today: localDate() };
      if (!userId) {
        localProgressStore.update((current) => applyLevelCompletion(current, full));
        return;
      }
      if (latest.current) commit(applyLevelCompletion(latest.current, full));
      void syncProgress(browserSupabase, userId, {
        kind: "complete_level",
        levelId: full.levelId,
        stars: full.stars,
        xp: full.xp,
        entryIds: full.entryIds,
        today: full.today,
      });
    },
    [userId, commit],
  );

  const recordReview = useCallback(
    (input: ReviewInput) => {
      const full: ReviewResult = { ...input, reviewedAt: new Date().toISOString(), today: localDate() };
      if (!userId) {
        localProgressStore.update((current) => applyReview(current, full));
        return;
      }
      if (!latest.current) return;
      const next = applyReview(latest.current, full);
      commit(next);
      void syncProgress(browserSupabase, userId, {
        kind: "review",
        items: Object.keys(input.grades).map((entryId) => {
          const s = next.srs[entryId];
          return {
            entry_id: entryId,
            ease: s.ease,
            interval_days: s.intervalDays,
            repetitions: s.repetitions,
            lapses: s.lapses,
            due_at: s.dueAt,
            last_reviewed_at: s.lastReviewedAt,
          };
        }),
        xp: input.xp,
        today: full.today,
      });
    },
    [userId, commit],
  );

  const snapshot = userId && accountSnapshot ? accountSnapshot : guest;
  const value = useMemo(
    () => ({ snapshot, ready: userId ? true : hydrated, signedIn: userId !== null, completeLevel, recordReview }),
    [snapshot, userId, hydrated, completeLevel, recordReview],
  );
  return <ProgressContext value={value}>{children}</ProgressContext>;
}

export function useProgress(): ProgressContextValue {
  const value = use(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside <ProgressProvider>");
  return value;
}
