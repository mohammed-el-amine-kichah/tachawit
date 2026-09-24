import { cache } from "react";
import { snapshotFromRows } from "@/lib/progress/account";
import type { ProgressSnapshot } from "@/lib/progress/snapshot";
import { createServerSupabase } from "../server";
import type { Database } from "../types";

export type AccountUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: Database["public"]["Enums"]["app_role"];
};

export type Account = { user: AccountUser; snapshot: ProgressSnapshot };

/**
 * The signed-in learner and their progress, or null for guests. Never cached across requests (it is
 * per user); memoized within one request so the layout and a page can both ask.
 */
export const getAccount = cache(async (): Promise<Account | null> => {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const [profile, levels, stats, srs] = await Promise.all([
    supabase.from("profiles").select("display_name, role").eq("id", claims.sub).maybeSingle(),
    supabase.from("level_progress").select("level_id, stars, attempts, completed_at"),
    supabase.from("learner_stats").select("xp, current_streak, longest_streak, last_active_on").maybeSingle(),
    supabase.from("srs_items").select("entry_id, ease, interval_days, repetitions, lapses, due_at, last_reviewed_at"),
  ]);
  for (const result of [profile, levels, stats, srs]) if (result.error) throw result.error;

  return {
    user: {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      displayName: profile.data?.display_name ?? null,
      role: profile.data?.role ?? "learner",
    },
    snapshot: snapshotFromRows({ levels: levels.data ?? [], stats: stats.data ?? null, srs: srs.data ?? [] }),
  };
});
