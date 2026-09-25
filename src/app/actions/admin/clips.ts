"use server";

import { z } from "zod";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { wordTimestampsSchema } from "@/lib/content/word-timestamps";
import { asAdmin } from "./run";

const id = z.uuid();

export async function setClipStatus(clipId: string, next: "draft" | "published"): Promise<ActionResult> {
  if (!id.safeParse(clipId).success || !["draft", "published"].includes(next)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("audio_clips").update({ status: next }).eq("id", clipId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

/** Makes this the clip learners hear for its entry. */
export async function setPrimaryClip(clipId: string): Promise<ActionResult> {
  if (!id.safeParse(clipId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { data: clip, error } = await supabase.from("audio_clips").select("entry_id").eq("id", clipId).single();
    if (error || !clip.entry_id) return { ok: false, error: error ? adminError(error) : "invalid" };
    const cleared = await supabase.from("audio_clips").update({ is_primary: false }).eq("entry_id", clip.entry_id).neq("id", clipId);
    if (cleared.error) return { ok: false, error: adminError(cleared.error) };
    const set = await supabase.from("audio_clips").update({ is_primary: true }).eq("id", clipId);
    return set.error ? { ok: false, error: adminError(set.error) } : { ok: true };
  });
}

export async function linkClip(clipId: string, entryId: string | null): Promise<ActionResult> {
  if (!id.safeParse(clipId).success || (entryId !== null && !id.safeParse(entryId).success)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("audio_clips").update({ entry_id: entryId, is_primary: false }).eq("id", clipId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function saveTimestamps(clipId: string, words: unknown): Promise<ActionResult> {
  const parsed = wordTimestampsSchema.safeParse(words);
  if (!id.safeParse(clipId).success || !parsed.success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase
      .from("audio_clips")
      .update({ word_timestamps: parsed.data.length ? parsed.data : null })
      .eq("id", clipId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

/** Deletes the clip and its files (web, slow and original). */
export async function deleteClip(clipId: string): Promise<ActionResult> {
  if (!id.safeParse(clipId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { data: clip, error } = await supabase
      .from("audio_clips")
      .select("storage_path, slow_storage_path, original_path")
      .eq("id", clipId)
      .single();
    if (error) return { ok: false, error: adminError(error) };
    const removed = await supabase.from("audio_clips").delete().eq("id", clipId);
    if (removed.error) return { ok: false, error: adminError(removed.error) };
    await supabase.storage.from("audio").remove([clip.storage_path, ...(clip.slow_storage_path ? [clip.slow_storage_path] : [])]);
    if (clip.original_path) await supabase.storage.from("audio-originals").remove([clip.original_path]);
    return { ok: true };
  });
}
