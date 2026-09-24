import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { readOutbox, writeOutbox, type OutboxOperation } from "./outbox";

type Client = SupabaseClient<Database>;

async function send(supabase: Client, userId: string, operation: OutboxOperation): Promise<void> {
  if (operation.kind === "complete_level") {
    const { error } = await supabase.rpc("complete_level", {
      p_level_id: operation.levelId,
      p_stars: operation.stars,
      p_xp: operation.xp,
      p_entry_ids: operation.entryIds,
      p_today: operation.today,
    });
    if (error) throw error;
    return;
  }
  if (operation.items.length) {
    const { error } = await supabase.from("srs_items").upsert(operation.items.map((item) => ({ ...item, user_id: userId })));
    if (error) throw error;
  }
  const { error } = await supabase.rpc("log_activity", { p_xp: operation.xp, p_today: operation.today });
  if (error) throw error;
}

/**
 * Add an operation and try to send everything pending, oldest first. Stops at the first failure.
 * The operation is saved before the Supabase client is loaded (lazily, so guests never download
 * it), so nothing is lost if loading fails offline.
 */
export async function syncProgress(loadClient: () => Promise<Client>, userId: string, operation?: OutboxOperation): Promise<boolean> {
  const queue = [...readOutbox(userId), ...(operation ? [operation] : [])];
  writeOutbox(userId, queue);
  if (!queue.length) return true;
  let supabase: Client;
  try {
    supabase = await loadClient();
  } catch {
    return false;
  }
  while (queue.length) {
    try {
      await send(supabase, userId, queue[0]);
    } catch (error) {
      // An outdated day is rejected by the server; drop it rather than blocking everything after it.
      if ((error as { code?: string }).code !== "22023") return false;
    }
    queue.shift();
    writeOutbox(userId, queue);
  }
  return true;
}
