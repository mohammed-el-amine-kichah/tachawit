"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { localizedFormSchema } from "@/lib/admin/schemas";
import { convertRecording } from "@/lib/audio/convert";
import { asAdmin } from "./run";

const id = z.uuid();

const editsSchema = z.object({
  text_latin: z.string().max(200),
  text_arabic: z.string().max(200),
  text_tifinagh: z.string().max(200),
  translations: localizedFormSchema,
  region_id: z.union([z.uuid(), z.literal("")]),
});

const orNull = (value: string) => (value.trim() ? value : null);

export async function rejectSubmission(submissionId: string, note: string): Promise<ActionResult> {
  if (!id.safeParse(submissionId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase, userId }) => {
    const { error } = await supabase
      .from("submissions")
      .update({ status: "rejected", reviewed_by: userId, reviewed_at: new Date().toISOString(), review_note: orNull(String(note).slice(0, 1000)) })
      .eq("id", submissionId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

/**
 * Approves a contribution. Words and variations become draft entries (reviewed before publishing);
 * recordings become draft clips from a speaker created with the consent the contributor gave.
 */
export async function approveSubmission(submissionId: string, edits: z.input<typeof editsSchema>): Promise<ActionResult> {
  const values = editsSchema.safeParse(edits);
  if (!id.safeParse(submissionId).success || !values.success) return { ok: false, error: "invalid" };

  return asAdmin(async ({ supabase, userId }) => {
    const { data: s, error } = await supabase.from("submissions").select("*").eq("id", submissionId).single();
    if (error) return { ok: false, error: adminError(error) };
    if (s.status !== "pending") return { ok: false, error: "invalid" };
    const v = values.data;

    let entryId: string | null = s.related_entry_id;
    // Recordings of unknown words become an entry only when a meaning is given; otherwise the clip
    // stays unlinked and can be linked from the Audio page.
    const hasMeaning = Object.keys(v.translations).length > 0;
    const needsEntry =
      s.kind === "word" || s.kind === "variation" || (s.kind === "recording" && !entryId && Boolean(v.text_latin.trim()) && hasMeaning);
    if (needsEntry) {
      if (!v.text_latin.trim() || !hasMeaning) return { ok: false, error: "invalid" };
      const note = [`Contributed${s.contributor_name ? ` by ${s.contributor_name}` : ""}`, s.village, s.message].filter(Boolean).join(" · ");
      const { data: entry, error: entryError } = await supabase
        .from("entries")
        .insert({
          text_latin: v.text_latin,
          text_arabic: orNull(v.text_arabic),
          text_tifinagh: orNull(v.text_tifinagh),
          translations: v.translations,
          region_id: v.region_id || null,
          notes: note,
          status: "draft",
        })
        .select("id")
        .single();
      if (entryError) return { ok: false, error: adminError(entryError) };
      entryId = entry.id;
    }

    if (s.kind === "recording" && s.audio_path && s.audio_consent) {
      const download = await supabase.storage.from("submissions").download(s.audio_path);
      if (download.error) return { ok: false, error: "not_found" };
      const original = await download.data.arrayBuffer();
      let converted;
      try {
        converted = await convertRecording(original, { startMs: 0, endMs: null });
      } catch {
        return { ok: false, error: "failed" };
      }
      const { data: speaker, error: speakerError } = await supabase
        .from("speakers")
        .insert({
          display_name: s.contributor_name ?? "Contributor",
          region_id: s.region_id,
          village: s.village,
          consent_given: true,
          consent_date: s.created_at.slice(0, 10),
        })
        .select("id")
        .single();
      if (speakerError) return { ok: false, error: adminError(speakerError) };

      const base = `clips/${randomUUID()}`;
      const ext = s.audio_path.split(".").pop() ?? "webm";
      const originalPath = `uploads/${randomUUID()}.${ext}`;
      const uploads = await Promise.all([
        supabase.storage.from("audio").upload(`${base}.m4a`, converted.normal, { contentType: "audio/mp4", cacheControl: "31536000" }),
        supabase.storage.from("audio").upload(`${base}-slow.m4a`, converted.slow, { contentType: "audio/mp4", cacheControl: "31536000" }),
        supabase.storage.from("audio-originals").upload(originalPath, original, { contentType: download.data.type || "audio/webm" }),
      ]);
      if (uploads.some((u) => u.error)) return { ok: false, error: "failed" };
      const { error: clipError } = await supabase.from("audio_clips").insert({
        entry_id: entryId,
        speaker_id: speaker.id,
        storage_path: `${base}.m4a`,
        slow_storage_path: `${base}-slow.m4a`,
        original_path: originalPath,
        mime_type: "audio/mp4",
        transcript: orNull(v.text_latin),
        status: "draft",
      });
      if (clipError) return { ok: false, error: adminError(clipError) };
    }

    const { error: updateError } = await supabase
      .from("submissions")
      .update({ status: "approved", reviewed_by: userId, reviewed_at: new Date().toISOString(), created_entry_id: needsEntry ? entryId : null })
      .eq("id", submissionId);
    return updateError ? { ok: false, error: adminError(updateError) } : { ok: true, id: entryId ?? undefined };
  });
}
