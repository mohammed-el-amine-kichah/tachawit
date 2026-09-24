"use client";

import { useCallback, useState } from "react";
import { loadPreviewEntries } from "@/app/actions/admin/content";
import type { EntryRow } from "@/lib/lesson/view";

/** Entries the builder has seen, loaded on demand for summaries and the live preview. */
export function useEntryRows(initial: EntryRow[]) {
  const [rows, setRows] = useState<Record<string, EntryRow>>(() => Object.fromEntries(initial.map((row) => [row.id, row])));

  const ensure = useCallback(
    async (ids: string[]) => {
      const missing = ids.filter((id) => id && !rows[id]);
      if (!missing.length) return;
      const loaded = await loadPreviewEntries(missing);
      setRows((current) => ({ ...current, ...Object.fromEntries(loaded.map((row) => [row.id, row])) }));
    },
    [rows],
  );

  return { rows, ensure };
}
