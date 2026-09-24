"use server";

import { z } from "zod";
import { buildGlossary, toViewEntry, type EntryRow, type Glossary, type ViewEntry } from "@/lib/lesson/view";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { ENTRY_WITH_AUDIO } from "@/lib/supabase/queries/entry-select";

export type ReviewData = { entries: Record<string, ViewEntry>; glossary: Glossary };

const POOL_SIZE = 24;

/** Published entries to review, plus a pool of other entries used as answer choices. */
export async function loadReviewEntries(ids: string[]): Promise<ReviewData> {
  const parsed = z.array(z.uuid()).max(30).safeParse(ids);
  if (!parsed.success || parsed.data.length === 0) return { entries: {}, glossary: {} };

  const supabase = createPublicClient();
  const [due, pool] = await Promise.all([
    supabase.from("entries").select(ENTRY_WITH_AUDIO).in("id", parsed.data).returns<EntryRow[]>(),
    supabase.from("entries").select(ENTRY_WITH_AUDIO).order("published_at", { ascending: false }).limit(POOL_SIZE).returns<EntryRow[]>(),
  ]);
  if (due.error) throw due.error;
  if (pool.error) throw pool.error;

  const storageUrl = getSupabaseEnv().url;
  const rows = [...due.data, ...pool.data];
  return {
    entries: Object.fromEntries(rows.map((row) => [row.id, toViewEntry(row, storageUrl)])),
    glossary: buildGlossary(rows, storageUrl),
  };
}
