"use server";

import { z } from "zod";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { regionFormSchema, speakerFormSchema, type RegionFormInput, type SpeakerFormInput } from "@/lib/admin/schemas";
import { asAdmin } from "./run";

const id = z.uuid();

export async function saveSpeaker(speakerId: string | null, input: SpeakerFormInput): Promise<ActionResult> {
  const values = speakerFormSchema.safeParse(input);
  if (!values.success || (speakerId !== null && !id.safeParse(speakerId).success)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const query = speakerId
      ? supabase.from("speakers").update(values.data).eq("id", speakerId).select("id").single()
      : supabase.from("speakers").insert(values.data).select("id").single();
    const { data, error } = await query;
    return error ? { ok: false, error: adminError(error, "speaker") } : { ok: true, id: data.id };
  });
}

export async function deleteSpeaker(speakerId: string): Promise<ActionResult> {
  if (!id.safeParse(speakerId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("speakers").delete().eq("id", speakerId);
    return error ? { ok: false, error: adminError(error, "speaker") } : { ok: true };
  });
}

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
