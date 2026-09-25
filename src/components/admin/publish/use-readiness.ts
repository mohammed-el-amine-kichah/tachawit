"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { checkReadiness } from "@/app/actions/admin/content";
import { readiness, type ReadinessInput } from "@/lib/admin/readiness";

/** What still hides a lesson or quiz from learners, read again whenever `version` changes (after each save). */
export function useReadiness(kind: "lesson" | "quiz", contentId: string, version: string) {
  const [input, setInput] = useState<ReadinessInput | null>(null);

  const reload = useCallback(async () => {
    const result = await checkReadiness(kind, contentId);
    if (result.ok) setInput(result.data);
    return result.ok ? result.data : null;
  }, [kind, contentId]);

  useEffect(() => {
    let alive = true;
    void checkReadiness(kind, contentId).then((result) => alive && result.ok && setInput(result.data));
    return () => {
      alive = false;
    };
  }, [kind, contentId, version]);

  const state = useMemo(() => (input ? readiness(input) : null), [input]);
  return { input, state, reload };
}
