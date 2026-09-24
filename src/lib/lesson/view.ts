import { normalizeWord } from "@/lib/audio/karaoke";
import type { LessonStep } from "@/lib/content/lesson";
import { localizedTextSchema, type LocalizedText } from "@/lib/content/localized-text";
import { wordTimestampsSchema, type WordTimestamp } from "@/lib/content/word-timestamps";
import type { TachawitTextSource } from "@/lib/script/resolve";
import { getPublicStorageUrl } from "@/lib/supabase/storage";

// Turns database rows into what the lesson player renders. Anything missing or unpublished is
// skipped so a half-finished edit can never crash a learner's lesson.

export type ClipRow = {
  id: string;
  storage_path: string;
  slow_storage_path: string | null;
  duration_ms: number | null;
  word_timestamps: unknown;
  is_primary: boolean;
  speakers: { display_name: string } | null;
};

export type EntryRow = {
  id: string;
  text_latin: string;
  text_arabic: string | null;
  text_tifinagh: string | null;
  translations: unknown;
  part_of_speech: string | null;
  image_path: string | null;
  regions: { name: unknown } | null;
  audio_clips: ClipRow[];
};

export type CultureNoteRow = {
  id: string;
  slug: string;
  title: unknown;
  summary: unknown;
  cover_image_path: string | null;
};

export type AudioInfo = {
  id: string;
  url: string;
  slowUrl: string | null;
  durationMs: number | null;
  words: WordTimestamp[] | null;
  speaker: string | null;
};

export type ViewEntry = TachawitTextSource & {
  id: string;
  translations: LocalizedText;
  partOfSpeech: string | null;
  regionName: LocalizedText | null;
  imageUrl: string | null;
  audio: AudioInfo | null;
};

export type LessonViewStep =
  | { id: string; type: "introduce" | "listen_repeat"; entry: ViewEntry; audio: AudioInfo | null }
  | {
      id: string;
      type: "culture_note";
      title: LocalizedText | null;
      body: LocalizedText | null;
      imageUrl: string | null;
      noteSlug: string | null;
    }
  | {
      id: string;
      type: "dialogue";
      title: LocalizedText | null;
      lines: { speaker: string; entry: ViewEntry; audio: AudioInfo | null }[];
    };

export type GlossaryEntry = { entryId: string; translations: LocalizedText; audio: AudioInfo | null };
export type Glossary = Record<string, GlossaryEntry>;

function localized(value: unknown): LocalizedText | null {
  const parsed = localizedTextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function toAudioInfo(clip: ClipRow, storageUrl: string): AudioInfo {
  const words = wordTimestampsSchema.safeParse(clip.word_timestamps);
  return {
    id: clip.id,
    url: getPublicStorageUrl(storageUrl, "audio", clip.storage_path),
    slowUrl: clip.slow_storage_path ? getPublicStorageUrl(storageUrl, "audio", clip.slow_storage_path) : null,
    durationMs: clip.duration_ms,
    words: words.success && words.data.length > 0 ? words.data : null,
    speaker: clip.speakers?.display_name ?? null,
  };
}

function primaryClip(clips: ClipRow[]): ClipRow | undefined {
  return clips.find((c) => c.is_primary) ?? clips[0];
}

export function toViewEntry(row: EntryRow, storageUrl: string): ViewEntry {
  const clip = primaryClip(row.audio_clips);
  return {
    id: row.id,
    text_latin: row.text_latin,
    text_arabic: row.text_arabic,
    text_tifinagh: row.text_tifinagh,
    translations: localized(row.translations) ?? {},
    partOfSpeech: row.part_of_speech,
    regionName: row.regions ? localized(row.regions.name) : null,
    imageUrl: row.image_path ? getPublicStorageUrl(storageUrl, "images", row.image_path) : null,
    audio: clip ? toAudioInfo(clip, storageUrl) : null,
  };
}

export function buildLessonView({
  steps,
  entries,
  cultureNotes,
  storageUrl,
}: {
  steps: readonly LessonStep[];
  entries: readonly EntryRow[];
  cultureNotes: readonly CultureNoteRow[];
  storageUrl: string;
}): LessonViewStep[] {
  const rows = new Map(entries.map((e) => [e.id, e]));
  const notes = new Map(cultureNotes.map((n) => [n.id, n]));

  const resolve = (entryId: string, audioClipId?: string) => {
    const row = rows.get(entryId);
    if (!row) return null;
    const entry = toViewEntry(row, storageUrl);
    const chosen = audioClipId ? row.audio_clips.find((c) => c.id === audioClipId) : undefined;
    return { entry, audio: chosen ? toAudioInfo(chosen, storageUrl) : entry.audio };
  };

  return steps.flatMap((step): LessonViewStep[] => {
    switch (step.type) {
      case "introduce":
      case "listen_repeat": {
        const resolved = resolve(step.entryId, step.audioClipId);
        return resolved ? [{ id: step.id, type: step.type, ...resolved }] : [];
      }
      case "dialogue": {
        const lines = step.lines.flatMap((line) => {
          const resolved = resolve(line.entryId, line.audioClipId);
          return resolved ? [{ speaker: line.speaker, ...resolved }] : [];
        });
        return lines.length >= 2 ? [{ id: step.id, type: "dialogue", title: step.title ?? null, lines }] : [];
      }
      case "culture_note": {
        const note = step.cultureNoteId ? notes.get(step.cultureNoteId) : undefined;
        if (step.cultureNoteId && !note) return [];
        const imagePath = step.imagePath ?? note?.cover_image_path ?? null;
        return [
          {
            id: step.id,
            type: "culture_note",
            title: step.title ?? (note ? localized(note.title) : null),
            body: step.body ?? (note ? localized(note.summary) : null),
            imageUrl: imagePath ? getPublicStorageUrl(storageUrl, "images", imagePath) : null,
            noteSlug: note?.slug ?? null,
          },
        ];
      }
    }
  });
}

/** Single-word entries by normalised Latin spelling, so any word in a phrase can be looked up. */
export function buildGlossary(entries: readonly EntryRow[], storageUrl: string): Glossary {
  const glossary: Glossary = {};
  for (const row of entries) {
    if (/\s/.test(row.text_latin.trim())) continue;
    const entry = toViewEntry(row, storageUrl);
    glossary[normalizeWord(row.text_latin)] = { entryId: row.id, translations: entry.translations, audio: entry.audio };
  }
  return glossary;
}
