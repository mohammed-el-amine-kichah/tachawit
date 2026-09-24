import "server-only";
import { updateTag } from "next/cache";
import { AdminAccessError, requireAdmin } from "@/lib/admin/guard";
import type { AdminError } from "@/lib/admin/result";
import { CONTENT_CACHE_TAG } from "@/lib/content/cache";

type Admin = Awaited<ReturnType<typeof requireAdmin>>;

/**
 * Runs an admin mutation: checks the role, reports access errors as results rather than throwing,
 * and refreshes cached learner content afterwards so changes show up immediately (not for reads).
 */
export async function asAdmin<T>(
  work: (admin: Admin) => Promise<T | { ok: false; error: AdminError }>,
  { invalidate = true }: { invalidate?: boolean } = {},
) {
  let admin: Admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError) return { ok: false as const, error: "forbidden" as const };
    throw error;
  }
  const result = await work(admin);
  if (invalidate) updateTag(CONTENT_CACHE_TAG);
  return result;
}
