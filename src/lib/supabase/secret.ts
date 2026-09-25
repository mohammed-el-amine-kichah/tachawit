import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import type { Database } from "./types";

/**
 * Client with the secret key: it bypasses row level security. Server only, and only for reads a
 * route has already narrowed to what the caller may see. Null when the key is not configured.
 */
export function createSecretClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient<Database>(getSupabaseEnv().url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
