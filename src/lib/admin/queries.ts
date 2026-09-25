import "server-only";
import { contentKeys } from "@/i18n/config";
import { referencedEntryIds, type DraftItem } from "@/lib/admin/builder";
import type { ReadinessInput } from "@/lib/admin/readiness";
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
        ...contentKeys.map((key) => `translations->>${key}.ilike.${like}`),
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

export async function listResourcesAdmin() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("resources").select("id, platform, name, url, summary, status").order("created_at", { ascending: false });
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

export type ContentKind = "lesson" | "quiz";

export async function listContent(kind: ContentKind) {
  const supabase = await createServerSupabase();
  if (kind === "lesson") {
    const { data, error } = await supabase.from("lessons").select("id, title, status, steps, updated_at, levels(id)").order("updated_at", { ascending: false });
    if (error) throw error;
    return data.map((row) => ({ id: row.id, title: row.title, status: row.status, count: Array.isArray(row.steps) ? row.steps.length : 0, usedBy: row.levels.length }));
  }
  const { data, error } = await supabase.from("quizzes").select("id, title, status, questions, updated_at, levels(id)").order("updated_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({ id: row.id, title: row.title, status: row.status, count: Array.isArray(row.questions) ? row.questions.length : 0, usedBy: row.levels.length }));
}

export async function getContent(kind: ContentKind, contentId: string) {
  const supabase = await createServerSupabase();
  if (kind === "lesson") {
    const { data, error } = await supabase.from("lessons").select("id, title, status, steps").eq("id", contentId).maybeSingle();
    if (error) throw error;
    return data ? { id: data.id, title: data.title, status: data.status, items: data.steps as unknown } : null;
  }
  const { data, error } = await supabase.from("quizzes").select("id, title, status, questions").eq("id", contentId).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, title: data.title, status: data.status, items: data.questions as unknown } : null;
}

export async function listCultureNoteOptions() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("culture_notes").select("id, slug, title, summary, cover_image_path, status").order("slug");
  if (error) throw error;
  return data;
}

export async function listUnits() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("units").select("id, slug, position, title, status, map_theme, levels(id, status)").order("position");
  if (error) throw error;
  return data;
}

export async function getUnitEditor(unitId: string) {
  const supabase = await createServerSupabase();
  const [unit, levels, lessons, quizzes, units] = await Promise.all([
    supabase.from("units").select("id, slug, position, title, description, map_theme, cover_image_path, status").eq("id", unitId).maybeSingle(),
    supabase
      .from("levels")
      .select("id, position, type, title, lesson_id, quiz_id, unlock_rule, map_x, map_y, status")
      .eq("unit_id", unitId)
      .order("position"),
    supabase.from("lessons").select("id, title, status").order("updated_at", { ascending: false }),
    supabase.from("quizzes").select("id, title, status").order("updated_at", { ascending: false }),
    supabase.from("units").select("id, title").order("position"),
  ]);
  for (const result of [unit, levels, lessons, quizzes, units]) if (result.error) throw result.error;
  if (!unit.data) return null;
  return { unit: unit.data, levels: levels.data ?? [], lessons: lessons.data ?? [], quizzes: quizzes.data ?? [], units: units.data ?? [] };
}

export async function listCultureAdmin() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("culture_notes").select("id, slug, category, title, status, updated_at").order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCultureAdmin(noteId: string) {
  const supabase = await createServerSupabase();
  const [note, units] = await Promise.all([
    supabase.from("culture_notes").select("id, slug, category, title, summary, body, cover_image_path, unit_id, status").eq("id", noteId).maybeSingle(),
    supabase.from("units").select("id, title").order("position"),
  ]);
  if (note.error) throw note.error;
  if (units.error) throw units.error;
  return note.data ? { note: note.data, units: units.data } : null;
}

export async function listSubmissions(status: "pending" | "approved" | "rejected") {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, kind, status, text_latin, text_arabic, text_tifinagh, translations, region_id, village, message, audio_path, audio_consent, contributor_name, contributor_email, created_at, review_note, created_entry_id, related:entries!submissions_related_entry_id_fkey(id, text_latin)")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(100);
  if (error) throw error;
  const paths = data.flatMap((s) => (s.audio_path ? [s.audio_path] : []));
  const signed = paths.length ? await supabase.storage.from("submissions").createSignedUrls(paths, 3600) : { data: [] };
  const urls = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));
  return data.map((s) => ({ ...s, audioUrl: s.audio_path ? (urls.get(s.audio_path) ?? null) : null }));
}

/** What the publish checklist needs: the content, every word it uses with its recordings, and its levels. */
export async function getPublishReadiness(kind: ContentKind, contentId: string): Promise<ReadinessInput | null> {
  const supabase = await createServerSupabase();
  const content =
    kind === "lesson"
      ? await supabase.from("lessons").select("status, items:steps").eq("id", contentId).maybeSingle()
      : await supabase.from("quizzes").select("status, items:questions").eq("id", contentId).maybeSingle();
  if (content.error) throw content.error;
  if (!content.data) return null;
  const items = (Array.isArray(content.data.items) ? content.data.items : []) as DraftItem[];
  const ids = referencedEntryIds(items);

  const [entries, levels] = await Promise.all([
    ids.length
      ? supabase.from("entries").select("id, text_latin, status, audio_clips(id, status, is_primary, speakers(display_name, consent_given))").in("id", ids)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("levels")
      .select("id, position, title, status, units(id, title, status)")
      .eq(kind === "lesson" ? "lesson_id" : "quiz_id", contentId)
      .order("position"),
  ]);
  if (entries.error) throw entries.error;
  if (levels.error) throw levels.error;

  return {
    kind,
    status: content.data.status,
    items,
    entries: entries.data.map((e) => ({
      id: e.id,
      text: e.text_latin,
      status: e.status,
      clips: e.audio_clips.map((c) => ({
        id: c.id,
        status: c.status,
        isPrimary: c.is_primary,
        consent: c.speakers?.consent_given ?? false,
        speaker: c.speakers?.display_name ?? null,
      })),
    })),
    levels: levels.data.flatMap((l) => (l.units ? [{ id: l.id, position: l.position, title: l.title, status: l.status, unit: l.units }] : [])),
  };
}
