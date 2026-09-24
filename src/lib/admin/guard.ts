import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export class AdminAccessError extends Error {
  constructor(public readonly reason: "signed_out" | "forbidden") {
    super(reason);
  }
}

/**
 * Server-side admin check for pages, actions and route handlers. Row level security enforces the
 * same rule in the database; this gives a clear answer before any query runs.
 */
export async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) throw new AdminAccessError("signed_out");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") throw new AdminAccessError("forbidden");
  return { supabase, userId };
}
