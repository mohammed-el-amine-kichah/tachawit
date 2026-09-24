import "server-only";
import { toAudioInfo, type AudioInfo, type ClipRow } from "@/lib/lesson/view";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabase } from "@/lib/supabase/server";

// Reads for the admin panel. They run as the signed-in admin, so row level security returns
// drafts too. Never cached: admins must always see the current state.

export const PAGE_SIZE = 40;

export async function dashboardCounts() {
  const supabase = await createServerSupabase();
  const count = async (table: "entries" | "audio_clips" | "lessons" | "quizzes" | "units" | "speakers" | "profiles" | "culture_notes", filter?: { column: string; value: string | boolean }) => {
    let query = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) query = query.eq(filter.column, filter.value);
    return (await query).count ?? 0;
  };
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [entries, publishedEntries, clips, publishedClips, lessons, quizzes, units, speakers, consenting, learners, pending, completions] =
    await Promise.all([
      count("entries"),
      count("entries", { column: "status", value: "published" }),
      count("audio_clips"),
      count("audio_clips", { column: "status", value: "published" }),
      count("lessons"),
      count("quizzes"),
      count("units"),
      count("speakers"),
      count("speakers", { column: "consent_given", value: true }),
      count("profiles"),
      supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending").then((r) => r.count ?? 0),
      supabase.from("level_progress").select("*", { count: "exact", head: true }).gte("updated_at", weekAgo).then((r) => r.count ?? 0),
    ]);
  return { entries, publishedEntries, clips, publishedClips, lessons, quizzes, units, speakers, consenting, learners, pending, completions };
}

/** Characters that have a meaning in PostgREST filter strings. */
const escapeFilter = (text: string) => text.replace(/[%,().*\\]/g, " ").trim();

export async function listEntries({ q, status, page }: { q: string; status: "all" | "draft" | "published"; page: number }) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("entries")
    .select("id, text_latin, text_arabic, text_tifinagh, translations, status, updated_at, regions(name), audio_clips(id)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  const term = escapeFilter(q);
  if (term) {
    const like = `*${term}*`;
    query = query.or(
      [
        `text_latin.ilike.${like}`,
        `text_arabic.ilike.${like}`,
        `text_tifinagh.ilike.${like}`,
        ...["en", "fr", "ar", "dz"].map((key) => `translations->>${key}.ilike.${like}`),
      ].join(","),
    );
  }
  if (status !== "all") query = query.eq("status", status);
  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: data, total: count ?? 0 };
}

export type AdminClip = {
  id: string;
  status: "draft" | "published";
  isPrimary: boolean;
  durationMs: number | null;
  speaker: { id: string; name: string; consent: boolean } | null;
  audio: AudioInfo;
  entry: { id: string; text_latin: string } | null;
};

const CLIP_SELECT =
  "id, status, is_primary, duration_ms, storage_path, slow_storage_path, word_timestamps, speaker_id, speakers(display_name, consent_given), entries(id, text_latin)";

type ClipQueryRow = {
  id: string;
  status: "draft" | "published";
  is_primary: boolean;
  duration_ms: number | null;
  storage_path: string;
  slow_storage_path: string | null;
  word_timestamps: unknown;
  speaker_id: string;
  speakers: { display_name: string; consent_given: boolean } | null;
  entries: { id: string; text_latin: string } | null;
};

function toAdminClip(row: ClipQueryRow, storageUrl: string): AdminClip {
  const clipRow: ClipRow = {
    id: row.id,
    storage_path: row.storage_path,
    slow_storage_path: row.slow_storage_path,
    duration_ms: row.duration_ms,
    word_timestamps: row.word_timestamps,
    is_primary: row.is_primary,
    speakers: row.speakers ? { display_name: row.speakers.display_name } : null,
  };
  return {
    id: row.id,
    status: row.status,
    isPrimary: row.is_primary,
    durationMs: row.duration_ms,
    speaker: row.speakers ? { id: row.speaker_id, name: row.speakers.display_name, consent: row.speakers.consent_given } : null,
    audio: toAudioInfo(clipRow, storageUrl),
    entry: row.entries,
  };
}

export async function getEntryForEditing(entryId: string) {
  const supabase = await createServerSupabase();
  const [entry, clips] = await Promise.all([
    supabase
      .from("entries")
      .select("id, text_latin, text_arabic, text_tifinagh, translations, part_of_speech, region_id, notes, image_path, status")
      .eq("id", entryId)
      .maybeSingle(),
    supabase.from("audio_clips").select(CLIP_SELECT).eq("entry_id", entryId).order("created_at").returns<ClipQueryRow[]>(),
  ]);
  if (entry.error) throw entry.error;
  if (clips.error) throw clips.error;
  if (!entry.data) return null;
  const storageUrl = getSupabaseEnv().url;
  return { entry: entry.data, clips: clips.data.map((row) => toAdminClip(row, storageUrl)) };
}

export async function listClips(filter: "all" | "unlinked" | "draft") {
  const supabase = await createServerSupabase();
  let query = supabase.from("audio_clips").select(CLIP_SELECT).order("created_at", { ascending: false }).limit(200);
  if (filter === "unlinked") query = query.is("entry_id", null);
  if (filter === "draft") query = query.eq("status", "draft");
  const { data, error } = await query.returns<ClipQueryRow[]>();
  if (error) throw error;
  const storageUrl = getSupabaseEnv().url;
  return data.map((row) => toAdminClip(row, storageUrl));
}

export async function listSpeakers() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("speakers")
    .select("id, display_name, village, consent_given, consent_date, region_id, public_bio, regions(name), audio_clips(id)")
    .order("display_name");
  if (error) throw error;
  return data;
}

export async function listRegions() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("regions").select("id, slug, name").order("slug");
  if (error) throw error;
  return data;
}

export async function listUsers(q: string) {
  const supabase = await createServerSupabase();
  let query = supabase.from("profiles").select("id, display_name, email, role, created_at").order("created_at", { ascending: false }).limit(100);
  const term = escapeFilter(q);
  if (term) query = query.or(`email.ilike.*${term}*,display_name.ilike.*${term}*`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
