"use server";

import { randomUUID } from "node:crypto";
import { getLocale } from "next-intl/server";
import { getContentKey, isLocale } from "@/i18n/config";
import { recordingSchema } from "@/lib/contribute/recording";
import { createServerSupabase } from "@/lib/supabase/server";

export type RecordingResult = { ok: true } | { ok: false; error: "invalid" | "too_many" | "audio" | "sign_in" | "consent" | "failed" };

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
/** A speaker recording word after word sends one every few seconds; this only stops runaway loops. */
const PER_HOUR = 200;
const AUDIO_TYPES: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

/**
 * A recording from a signed-in speaker who has given consent. It waits in the admin review queue,
 * credited to their speaker profile, with the region and village from that profile.
 */
export async function submitRecording(form: FormData): Promise<RecordingResult> {
  const audio = form.get("audio");
  const file = audio instanceof File && audio.size > 0 ? audio : null;
  const parsed = recordingSchema.safeParse({
    text_latin: text(form, "text_latin"),
    text_arabic: text(form, "text_arabic"),
    text_tifinagh: text(form, "text_tifinagh"),
    meaning: text(form, "meaning"),
    prompt_entry_id: text(form, "prompt_entry_id"),
  });
  if (!parsed.success || !file) return { ok: false, error: "invalid" };
  const type = file.type.split(";")[0];
  if (!AUDIO_TYPES[type] || file.size > MAX_AUDIO_BYTES) return { ok: false, error: "audio" };

  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { ok: false, error: "sign_in" };

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ data: speaker }, { data: profile }, { count }] = await Promise.all([
    supabase.from("speakers").select("display_name, region_id, village, consent_given").eq("id", userId).maybeSingle(),
    supabase.from("profiles").select("email").eq("id", userId).maybeSingle(),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("submitter_id", userId).gte("created_at", since),
  ]);
  if (!speaker?.consent_given) return { ok: false, error: "consent" };
  if ((count ?? 0) >= PER_HOUR) return { ok: false, error: "too_many" };

  const audioPath = `pending/${randomUUID()}.${AUDIO_TYPES[type]}`;
  const upload = await supabase.storage.from("submissions").upload(audioPath, file, { contentType: type });
  if (upload.error) {
    console.error("Recording upload failed", upload.error.message);
    return { ok: false, error: "failed" };
  }

  const locale = await getLocale();
  const values = parsed.data;
  const { error } = await supabase.from("submissions").insert({
    kind: "recording",
    text_latin: values.text_latin,
    text_arabic: values.text_arabic,
    text_tifinagh: values.text_tifinagh,
    translations: values.meaning && isLocale(locale) ? { [getContentKey(locale)]: values.meaning.trim() } : null,
    related_entry_id: values.prompt_entry_id,
    region_id: speaker.region_id,
    village: speaker.village,
    audio_path: audioPath,
    audio_consent: true,
    contributor_name: speaker.display_name,
    contributor_email: profile?.email ?? claims?.claims.email ?? null,
    submitter_id: userId,
  });
  if (error) {
    console.error("Recording insert failed", error.message);
    return { ok: false, error: "failed" };
  }
  return { ok: true };
}
