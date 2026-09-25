import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { latinToTifinagh } from "@/lib/admin/tifinagh";
import { parseCsv } from "@/lib/admin/csv";
import { splitWords } from "@/lib/audio/karaoke";
import { levelTypes, mapThemes, partsOfSpeech } from "@/lib/content/enums";
import { collectLessonEntryIds, lessonStepsSchema } from "@/lib/content/lesson";
import { localizedTextSchema } from "@/lib/content/localized-text";
import { collectQuizEntryIds, quizQuestionsSchema, type QuizQuestion } from "@/lib/content/quiz";

// The core curriculum (content/core-curriculum) is data imported into the database as drafts by
// scripts/import-core-curriculum.mjs. These checks run before every import.

const dir = join(process.cwd(), "content", "core-curriculum");

const fullText = z.strictObject({ en: z.string().trim().min(1), fr: z.string().trim().min(1), ar: z.string().trim().min(1) });
const localized = fullText.refine((value) => localizedTextSchema.safeParse(value).success, { message: "Not valid multilingual text" });

// Rows carry no `status` (the database default keeps them drafts) and no review notes.
const curriculumFileSchema = z.strictObject({
  unit: z.strictObject({
    id: z.uuid(),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    title: localized,
    description: localized,
    map_theme: z.enum(mapThemes),
  }),
  entries: z.array(
    z.strictObject({
      id: z.uuid(),
      text_latin: z.string().trim().min(1),
      text_arabic: z.string().trim().min(1),
      text_tifinagh: z.string().trim().min(1),
      translations: localized,
      part_of_speech: z.enum(partsOfSpeech),
      region_id: z.uuid().nullable(),
    }),
  ),
  lessons: z.array(z.strictObject({ id: z.uuid(), title: localized, steps: lessonStepsSchema })),
  quizzes: z.array(z.strictObject({ id: z.uuid(), title: localized, questions: quizQuestionsSchema })),
  levels: z.array(
    z.strictObject({
      id: z.uuid(),
      position: z.int().nonnegative(),
      type: z.enum(levelTypes),
      title: localized,
      lesson_id: z.uuid().nullable(),
      quiz_id: z.uuid().nullable(),
      map_x: z.number().min(0).max(1),
      map_y: z.number().min(0).max(1),
    }),
  ),
});

type CurriculumFile = z.infer<typeof curriculumFileSchema>;
type Entry = CurriculumFile["entries"][number];

const fileNames = readdirSync(dir).filter((name) => name.endsWith(".json")).sort();
const raw = fileNames.map((name) => ({ name, json: JSON.parse(readFileSync(join(dir, name), "utf8")) as unknown }));
const files = raw.map(({ json }) => curriculumFileSchema.parse(json));

const entries = new Map<string, Entry>(files.flatMap((file) => file.entries.map((entry) => [entry.id, entry] as const)));
const entry = (id: string): Entry => {
  const found = entries.get(id);
  if (!found) throw new Error(`Unknown entry ${id}`);
  return found;
};
const wordCount = (text: string) => splitWords(text).length;

/** Entries a unit's lessons have taught before the level at `position`. */
function taughtBefore(file: CurriculumFile, position: number): Set<string> {
  const lessons = new Map(file.lessons.map((lesson) => [lesson.id, lesson]));
  return new Set(
    file.levels
      .filter((level) => level.position < position && level.lesson_id)
      .flatMap((level) => collectLessonEntryIds(lessons.get(level.lesson_id ?? "")?.steps ?? [])),
  );
}

function distractorIds(question: QuizQuestion): string[] {
  return "distractorEntryIds" in question ? (question.distractorEntryIds ?? []) : [];
}

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

describe("core curriculum files", () => {
  it("has six units, each in its own file, validated by the shared schemas", () => {
    expect(fileNames).toHaveLength(6);
    for (const { name, json } of raw) {
      const result = curriculumFileSchema.safeParse(json);
      expect(result.error?.issues, name).toBeUndefined();
    }
  });

  it("uses every map theme", () => {
    expect(new Set(files.map((file) => file.unit.map_theme))).toEqual(new Set(mapThemes));
  });

  it("gives every row a unique id", () => {
    const ids = files.flatMap((file) => [
      file.unit.id,
      ...file.entries.map((e) => e.id),
      ...file.lessons.map((l) => l.id),
      ...file.quizzes.map((q) => q.id),
      ...file.levels.map((l) => l.id),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    const slugs = files.map((file) => file.unit.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("reuses entries instead of duplicating them", () => {
    const latin = [...entries.values()].map((e) => e.text_latin);
    expect(new Set(latin).size).toBe(latin.length);
  });

  it("only references entries that exist", () => {
    for (const file of files) {
      const referenced = [
        ...file.lessons.flatMap((lesson) => collectLessonEntryIds(lesson.steps)),
        ...file.quizzes.flatMap((quiz) => collectQuizEntryIds(quiz.questions)),
      ];
      expect(referenced.filter((id) => !entries.has(id)), file.unit.slug).toEqual([]);
    }
  });

  it("teaches every entry in the unit that defines it", () => {
    for (const file of files) {
      const taught = new Set(file.lessons.flatMap((lesson) => collectLessonEntryIds(lesson.steps)));
      expect(file.entries.filter((e) => !taught.has(e.id)).map((e) => e.text_latin), file.unit.slug).toEqual([]);
    }
  });

  it("generates Tifinagh from the Latin spelling", () => {
    for (const e of entries.values()) expect(e.text_tifinagh, e.text_latin).toBe(latinToTifinagh(e.text_latin));
  });

  it("keeps the same words in Arabic script as in Latin, so quizzes work in every script", () => {
    for (const e of entries.values()) expect(wordCount(e.text_arabic), e.text_latin).toBe(wordCount(e.text_latin));
  });

  it("shows learners final copy, without review markers", () => {
    const marker = /\[placeholder\]|\btodo\b|\bsample\b|\bexample\b|to be checked|à vérifier|exemple|مثال/i;
    for (const { name, json } of raw) expect(strings(json).filter((text) => marker.test(text)), name).toEqual([]);
  });
});

describe.each(files.map((file) => [file.unit.slug, file] as const))("unit %s", (_slug, file) => {
  const lessonsById = new Map(file.lessons.map((lesson) => [lesson.id, lesson]));
  const quizzesById = new Map(file.quizzes.map((quiz) => [quiz.id, quiz]));

  it("has 3–4 lessons of 6–10 steps", () => {
    expect(file.lessons.length).toBeGreaterThanOrEqual(3);
    expect(file.lessons.length).toBeLessThanOrEqual(4);
    for (const lesson of file.lessons) {
      expect(lesson.steps.length).toBeGreaterThanOrEqual(6);
      expect(lesson.steps.length).toBeLessThanOrEqual(10);
    }
  });

  it("uses introduce and listen-and-repeat steps, and a dialogue of 4–8 lines between two named speakers", () => {
    const steps = file.lessons.flatMap((lesson) => lesson.steps);
    expect(steps.some((step) => step.type === "introduce")).toBe(true);
    expect(steps.some((step) => step.type === "listen_repeat")).toBe(true);
    const dialogues = steps.filter((step) => step.type === "dialogue");
    expect(dialogues.length).toBeGreaterThan(0);
    for (const dialogue of dialogues) {
      expect(dialogue.lines.length).toBeGreaterThanOrEqual(4);
      expect(dialogue.lines.length).toBeLessThanOrEqual(8);
      expect(new Set(dialogue.lines.map((line) => line.speaker)).size).toBe(2);
    }
  });

  it("has 33–50 entries, about two-thirds single words", () => {
    expect(file.entries.length).toBeGreaterThanOrEqual(33);
    expect(file.entries.length).toBeLessThanOrEqual(50);
    const phrases = file.entries.filter((e) => wordCount(e.text_latin) > 1).length;
    expect(phrases / file.entries.length).toBeLessThanOrEqual(0.45);
  });

  it("orders the map: lessons, then a quiz, then a boss quiz", () => {
    const levels = [...file.levels].sort((a, b) => a.position - b.position);
    expect(levels.map((level) => level.position)).toEqual(levels.map((_, i) => i));
    expect(levels.map((level) => level.type)).toEqual([...file.lessons.map(() => "lesson"), "quiz", "boss"]);
    for (const level of levels) {
      if (level.type === "lesson") expect(lessonsById.has(level.lesson_id ?? "")).toBe(true);
      else expect(quizzesById.has(level.quiz_id ?? "")).toBe(true);
    }
    expect(new Set(levels.map((level) => level.lesson_id ?? level.quiz_id)).size).toBe(levels.length);
  });

  it("zig-zags its nodes down the map", () => {
    const levels = [...file.levels].sort((a, b) => a.position - b.position);
    levels.slice(1).forEach((level, i) => {
      const previous = levels[i];
      expect(level.map_y).toBeGreaterThan(previous.map_y);
      expect(level.map_x).not.toBe(previous.map_x);
    });
  });

  describe.each(file.levels.filter((level) => level.quiz_id).map((level) => [level.type, level] as const))("%s", (_type, level) => {
    const quiz = quizzesById.get(level.quiz_id ?? "");
    if (!quiz) throw new Error(`Missing quiz for level ${level.id}`);
    const taught = taughtBefore(file, level.position);

    it("has 8–12 questions mixing all six question types", () => {
      expect(quiz.questions.length).toBeGreaterThanOrEqual(8);
      expect(quiz.questions.length).toBeLessThanOrEqual(12);
      expect(new Set(quiz.questions.map((q) => q.type)).size).toBe(6);
    });

    it("only uses entries the unit's lessons have already taught", () => {
      expect(collectQuizEntryIds(quiz.questions).filter((id) => !taught.has(id)).map((id) => entry(id).text_latin)).toEqual([]);
    });

    it.each(quiz.questions.map((q) => [q.id, q] as const))("question %s is well formed", (_id, question) => {
      if (question.type === "match_pairs") {
        const meanings = question.entryIds.map((id) => entry(id).translations.en);
        expect(new Set(meanings).size).toBe(meanings.length);
        return;
      }
      const answer = entry(question.entryId);
      const distractors = distractorIds(question).map(entry);

      if (question.type === "listen_pick_translation" || question.type === "pick_audio") {
        for (const d of distractors) {
          expect(d.part_of_speech, d.text_latin).toBe(answer.part_of_speech);
          expect(d.translations.en).not.toBe(answer.translations.en);
        }
      }
      if (question.type === "build_sentence") {
        expect(wordCount(answer.text_latin)).toBeGreaterThan(1);
      }
      if (question.type === "fill_blank") {
        const words = splitWords(answer.text_latin);
        expect(words.length).toBeGreaterThan(1);
        expect(question.blankWordIndex).toBeLessThan(words.length);
        const missing = words[question.blankWordIndex];
        expect(missing).toMatch(/^[\p{L}-]+$/u);
        // The options are each distractor's first word: single words of one kind, none equal to the answer.
        for (const d of distractors) {
          expect(wordCount(d.text_latin), d.text_latin).toBe(1);
          expect(d.text_latin).not.toBe(missing);
        }
        expect(new Set(distractors.map((d) => d.part_of_speech)).size).toBe(1);
      }
    });
  });
});

describe("review files", () => {
  const read = (name: string) => parseCsv(readFileSync(join(dir, "review", name), "utf8"));
  const all = [...entries.values()];

  it("lists every entry once in the review sheet, low confidence first", () => {
    const rows = read("review-sheet.csv");
    const [header] = Object.keys(rows[0] ?? {});
    expect(header).toMatch(/Unité/);
    const idKey = Object.keys(rows[0]).find((key) => key.includes("Identifiant")) ?? "";
    const latinKey = Object.keys(rows[0]).find((key) => key.includes("Latin")) ?? "";
    const confidenceKey = Object.keys(rows[0]).find((key) => key.includes("Confiance")) ?? "";

    expect(rows.map((row) => row[idKey]).sort()).toEqual(all.map((e) => e.id).sort());
    for (const row of rows) expect(row[latinKey]).toBe(entry(row[idKey]).text_latin);

    const rank = { low: 0, medium: 1, high: 2 } as const;
    const ranks = rows.map((row) => rank[row[confidenceKey] as keyof typeof rank]);
    expect(ranks.every((r) => r !== undefined)).toBe(true);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("lists every entry once in the recording list, in lesson order", () => {
    const rows = read("recording-list.csv");
    const idKey = Object.keys(rows[0]).find((key) => key.includes("Identifiant")) ?? "";
    const expected = files.flatMap((file) => file.lessons.flatMap((lesson) => collectLessonEntryIds(lesson.steps)));
    expect(rows.map((row) => row[idKey])).toEqual([...new Set(expected)]);
    expect(rows).toHaveLength(all.length);
  });
});
