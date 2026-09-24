"use server";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { contentKeys, getContentKey, isLocale } from "@/i18n/config";
import { contributionSchema, contributorFor } from "@/lib/culture/contribution";
import { createPublicClient } from "@/lib/supabase/public";
import { createServerSupabase } from "@/lib/supabase/server";

export type ContributionResult = { ok: true } | { ok: false; error: "invalid" | "too_many" | "audio" | "failed" };

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const PER_HOUR = 10;
const AUDIO_TYPES: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

/** Salted hash of the sender's address: enough to slow down repeats, never stored in the clear. */
async function clientHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const salt = process.env.SUBMISSION_HASH_SALT ?? "tachawit";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

/** A suggestion from anyone (signed in or not). It waits in the admin review queue. */
export async function submitContribution(form: FormData): Promise<ContributionResult> {
  // Bots fill every field, people never see this one.
  if (text(form, "website")) return { ok: true };

  const audio = form.get("audio");
  const file = audio instanceof File && audio.size > 0 ? audio : null;
  const parsed = contributionSchema.safeParse({
    kind: text(form, "kind"),
    text_latin: text(form, "text_latin"),
    text_arabic: text(form, "text_arabic"),
    text_tifinagh: text(form, "text_tifinagh"),
    meaning: text(form, "meaning"),
    related_entry_id: text(form, "related_entry_id"),
    region_id: text(form, "region_id"),
    village: text(form, "village"),
    message: text(form, "message"),
    contributor_name: text(form, "contributor_name"),
    contributor_email: text(form, "contributor_email"),
    audio_consent: form.get("audio_consent") === "on",
    has_audio: file !== null,
  });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const type = file?.type.split(";")[0] ?? "";
  if (file && (!AUDIO_TYPES[type] || file.size > MAX_AUDIO_BYTES)) return { ok: false, error: "audio" };

  const supabase = await createServerSupabase();
  const hash = await clientHash();
  const { data: recent } = await supabase.rpc("recent_submission_count", { p_client_hash: hash, p_minutes: 60 });
  if ((recent ?? 0) >= PER_HOUR) return { ok: false, error: "too_many" };

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub ?? null;
  const locale = await getLocale();
  const values = parsed.data;

  // Signed-in contributors are credited from their account, never from the form fields.
  const profile = userId ? (await supabase.from("profiles").select("display_name, email").eq("id", userId).maybeSingle()).data : null;
  const contributor = contributorFor(
    userId ? { displayName: profile?.display_name ?? null, email: profile?.email ?? claims?.claims.email ?? null } : null,
    { name: values.contributor_name, email: values.contributor_email },
  );

  let audioPath: string | null = null;
  if (file) {
    audioPath = `pending/${randomUUID()}.${AUDIO_TYPES[type]}`;
    const upload = await supabase.storage.from("submissions").upload(audioPath, file, { contentType: type });
    if (upload.error) {
      console.error("Contribution audio upload failed", upload.error.message);
      return { ok: false, error: "failed" };
    }
  }

  const { error } = await supabase.from("submissions").insert({
    kind: values.kind,
    text_latin: values.text_latin.trim() ? values.text_latin : null,
    text_arabic: values.text_arabic,
    text_tifinagh: values.text_tifinagh,
    translations: values.meaning.trim() && isLocale(locale) ? { [getContentKey(locale)]: values.meaning.trim() } : null,
    related_entry_id: values.related_entry_id,
    region_id: values.region_id,
    village: values.village,
    message: values.message.trim() ? values.message : null,
    audio_path: audioPath,
    audio_consent: values.audio_consent,
    contributor_name: contributor.name,
    contributor_email: contributor.email,
    submitter_id: userId,
    client_hash: hash,
  });
  if (error) {
    console.error("Contribution insert failed", error.message);
    return { ok: false, error: "failed" };
  }
  return { ok: true };
}

export type PublicEntryOption = { id: string; text_latin: string; translations: unknown };

/** Published entries, for pointing a variation or correction at a word. */
export async function searchPublishedEntries(query: string): Promise<PublicEntryOption[]> {
  const term = z.string().max(60).catch("").parse(query).replace(/[%,().*\\]/g, " ").trim();
  if (!term) return [];
  const like = `*${term}*`;
  const { data } = await createPublicClient()
    .from("entries")
    .select("id, text_latin, translations")
    .or([`text_latin.ilike.${like}`, ...contentKeys.map((k) => `translations->>${k}.ilike.${like}`)].join(","))
    .limit(10);
  return data ?? [];
}
