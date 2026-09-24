import { describe, expect, it } from "vitest";
import { buildGlossary, buildLessonView, type EntryRow } from "./view";

const base = "http://127.0.0.1:54321";
const E = (n: number) => `30000000-0000-4000-8000-00000000000${n}`;
const C = (n: number) => `40000000-0000-4000-8000-00000000000${n}`;

const entry = (n: number, text: string, clips: EntryRow["audio_clips"] = []): EntryRow => ({
  id: E(n),
  text_latin: text,
  text_arabic: null,
  text_tifinagh: null,
  translations: { en: `t${n}` },
  part_of_speech: null,
  image_path: n === 1 ? "entries/azul.webp" : null,
  regions: null,
  audio_clips: clips,
});

const clip = (n: number, primary: boolean, extra: Partial<EntryRow["audio_clips"][number]> = {}) => ({
  id: C(n),
  storage_path: `placeholder/${n}.mp3`,
  slow_storage_path: null,
  duration_ms: 800,
  word_timestamps: null,
  is_primary: primary,
  speakers: { display_name: "Speaker" },
  ...extra,
});

const entries = [
  entry(1, "azul", [clip(1, true), clip(9, false)]),
  entry(2, "azul fellawen", [clip(2, true, { word_timestamps: [{ word: "azul", startMs: 0 }, { word: "fellawen", startMs: 500 }] })]),
  entry(3, "tanmirt"),
];

describe("buildLessonView", () => {
  it("resolves entries, the primary clip and public URLs", () => {
    const view = buildLessonView({ steps: [{ id: "s1", type: "introduce", entryId: E(1) }], entries, cultureNotes: [], storageUrl: base });
    expect(view).toHaveLength(1);
    const step = view[0];
    if (step.type !== "introduce") throw new Error("wrong type");
    expect(step.entry.imageUrl).toBe(`${base}/storage/v1/object/public/images/entries/azul.webp`);
    expect(step.audio?.id).toBe(C(1));
    expect(step.audio?.url).toBe(`${base}/storage/v1/object/public/audio/placeholder/1.mp3`);
  });

  it("uses the clip a step asks for", () => {
    const [step] = buildLessonView({
      steps: [{ id: "s1", type: "listen_repeat", entryId: E(1), audioClipId: C(9) }],
      entries,
      cultureNotes: [],
      storageUrl: base,
    });
    expect(step.type === "listen_repeat" && step.audio?.id).toBe(C(9));
  });

  it("keeps entries without audio but reports no audio", () => {
    const [step] = buildLessonView({ steps: [{ id: "s1", type: "introduce", entryId: E(3) }], entries, cultureNotes: [], storageUrl: base });
    expect(step.type === "introduce" && step.audio).toBeNull();
  });

  it("drops steps whose entry is missing or unpublished instead of crashing", () => {
    const view = buildLessonView({
      steps: [
        { id: "s1", type: "introduce", entryId: "90000000-0000-4000-8000-000000000000" },
        { id: "s2", type: "introduce", entryId: E(3) },
      ],
      entries,
      cultureNotes: [],
      storageUrl: base,
    });
    expect(view.map((s) => s.id)).toEqual(["s2"]);
  });

  it("drops dialogue lines with missing entries and the dialogue if fewer than two remain", () => {
    const view = buildLessonView({
      steps: [
        { id: "d1", type: "dialogue", lines: [{ speaker: "A", entryId: E(1) }, { speaker: "B", entryId: E(2) }, { speaker: "A", entryId: "90000000-0000-4000-8000-000000000000" }] },
        { id: "d2", type: "dialogue", lines: [{ speaker: "A", entryId: E(1) }, { speaker: "B", entryId: "90000000-0000-4000-8000-000000000000" }] },
      ],
      entries,
      cultureNotes: [],
      storageUrl: base,
    });
    expect(view).toHaveLength(1);
    expect(view[0].type === "dialogue" && view[0].lines).toHaveLength(2);
  });

  it("fills a culture step from a linked note, or drops it if the note is not published", () => {
    const note = { id: "70000000-0000-4000-8000-0000000000aa", slug: "yennayer", title: { en: "Yennayer" }, summary: { en: "New year" }, cover_image_path: null };
    const view = buildLessonView({
      steps: [
        { id: "c1", type: "culture_note", cultureNoteId: note.id },
        { id: "c2", type: "culture_note", cultureNoteId: "70000000-0000-4000-8000-0000000000bb" },
        { id: "c3", type: "culture_note", body: { en: "Inline" } },
      ],
      entries,
      cultureNotes: [note],
      storageUrl: base,
    });
    expect(view.map((s) => s.id)).toEqual(["c1", "c3"]);
    const first = view[0];
    expect(first.type === "culture_note" && first.body).toEqual({ en: "New year" });
    expect(first.type === "culture_note" && first.noteSlug).toBe("yennayer");
  });
});

describe("buildGlossary", () => {
  it("indexes single-word entries by their normalised Latin spelling", () => {
    const glossary = buildGlossary(
      [entry(1, "Azul", [clip(1, true)]), entry(2, "azul fellawen")],
      base,
    );
    expect(Object.keys(glossary)).toEqual(["azul"]);
    expect(glossary.azul.translations).toEqual({ en: "t1" });
    expect(glossary.azul.audio?.id).toBe(C(1));
  });
});
