"use server";

import { z } from "zod";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { resourceFormSchema, type ResourceFormInput } from "@/lib/admin/schemas";
import { asAdmin } from "./run";

const id = z.uuid();

export async function saveResource(resourceId: string | null, input: ResourceFormInput): Promise<ActionResult> {
  const values = resourceFormSchema.safeParse(input);
  if (!values.success || (resourceId !== null && !id.safeParse(resourceId).success)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const query = resourceId
      ? supabase.from("resources").update(values.data).eq("id", resourceId).select("id").single()
      : supabase.from("resources").insert(values.data).select("id").single();
    const { data, error } = await query;
    return error ? { ok: false, error: adminError(error) } : { ok: true, id: data.id };
  });
}

export async function setResourceStatus(resourceId: string, next: "draft" | "published"): Promise<ActionResult> {
  if (!id.safeParse(resourceId).success || !["draft", "published"].includes(next)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("resources").update({ status: next }).eq("id", resourceId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function deleteResource(resourceId: string): Promise<ActionResult> {
  if (!id.safeParse(resourceId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("resources").delete().eq("id", resourceId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}
