"use server";

import { z } from "zod";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { regionFormSchema, type RegionFormInput } from "@/lib/admin/schemas";
import { asAdmin } from "./run";

const id = z.uuid();

export async function saveRegion(regionId: string | null, input: RegionFormInput): Promise<ActionResult> {
  const values = regionFormSchema.safeParse(input);
  if (!values.success || (regionId !== null && !id.safeParse(regionId).success)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const query = regionId
      ? supabase.from("regions").update(values.data).eq("id", regionId).select("id").single()
      : supabase.from("regions").insert(values.data).select("id").single();
    const { data, error } = await query;
    return error ? { ok: false, error: adminError(error) } : { ok: true, id: data.id };
  });
}

export async function deleteRegion(regionId: string): Promise<ActionResult> {
  if (!id.safeParse(regionId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("regions").delete().eq("id", regionId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}
