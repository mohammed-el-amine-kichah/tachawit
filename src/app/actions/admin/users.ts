"use server";

import { z } from "zod";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { asAdmin } from "./run";

/** Promote or demote someone. Admins cannot demote themselves, so the panel is never locked out. */
export async function setUserRole(profileId: string, role: "learner" | "admin"): Promise<ActionResult> {
  if (!z.uuid().safeParse(profileId).success || !["learner", "admin"].includes(role)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase, userId }) => {
    if (profileId === userId) return { ok: false, error: "invalid" };
    const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}
