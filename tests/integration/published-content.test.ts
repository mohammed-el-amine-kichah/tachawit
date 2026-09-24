import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { lessonStepsSchema, collectLessonEntryIds } from "@/lib/content/lesson";
import { localizedTextSchema } from "@/lib/content/localized-text";
import { collectQuizEntryIds, quizQuestionsSchema } from "@/lib/content/quiz";
import { mapPositionSchema, unlockRuleSchema } from "@/lib/content/unlock-rule";
import { wordTimestampsSchema } from "@/lib/content/word-timestamps";
import type { Database } from "@/lib/supabase/types";

// Checks what learners actually receive (as the anonymous role) against the app's Zod contracts.
// Runs against the Supabase instance in .env.local; skipped when none is configured or reachable.

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function reachable(): Promise<boolean> {
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key }, signal: AbortSignal.timeout(2000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

const available = await reachable();

describe.skipIf(!available)("published content served to learners", () => {
  let supabase: SupabaseClient<Database>;
  let visibleEntryIds: Set<string>;

  beforeAll(async () => {
    supabase = createClient<Database>(url ?? "", key ?? "", { auth: { persistSession: false } });
    const { data, error } = await supabase.from("entries").select("id");
    expect(error).toBeNull();
    visibleEntryIds = new Set((data ?? []).map((e) => e.id));
  });

  it("units and levels are well formed", async () => {
    const { data: units, error } = await supabase.from("units").select("title, description, levels(unlock_rule, map_x, map_y, title)");
    expect(error).toBeNull();
    expect(units?.length).toBeGreaterThan(0);
    for (const unit of units ?? []) {
      expect(localizedTextSchema.safeParse(unit.title).success).toBe(true);
      if (unit.description) expect(localizedTextSchema.safeParse(unit.description).success).toBe(true);
      for (const level of unit.levels) {
        expect(unlockRuleSchema.safeParse(level.unlock_rule).success).toBe(true);
        expect(mapPositionSchema.safeParse({ x: level.map_x, y: level.map_y }).success).toBe(true);
        if (level.title) expect(localizedTextSchema.safeParse(level.title).success).toBe(true);
      }
    }
  });

  it("lessons match the lesson schema and only use visible entries", async () => {
    const { data, error } = await supabase.from("lessons").select("id, title, steps");
    expect(error).toBeNull();
    for (const lesson of data ?? []) {
      expect(localizedTextSchema.safeParse(lesson.title).success).toBe(true);
      const steps = lessonStepsSchema.parse(lesson.steps);
      for (const id of collectLessonEntryIds(steps)) expect(visibleEntryIds, `${lesson.id} → ${id}`).toContain(id);
    }
  });

  it("quizzes match the quiz schema and only use visible entries", async () => {
    const { data, error } = await supabase.from("quizzes").select("id, title, questions");
    expect(error).toBeNull();
    for (const quiz of data ?? []) {
      expect(localizedTextSchema.safeParse(quiz.title).success).toBe(true);
      const questions = quizQuestionsSchema.parse(quiz.questions);
      for (const id of collectQuizEntryIds(questions)) expect(visibleEntryIds, `${quiz.id} → ${id}`).toContain(id);
    }
  });

  it("entries have valid translations and audio has valid word timings", async () => {
    const { data, error } = await supabase.from("entries").select("translations, audio_clips(word_timestamps)");
    expect(error).toBeNull();
    for (const entry of data ?? []) {
      expect(localizedTextSchema.safeParse(entry.translations).success).toBe(true);
      for (const clip of entry.audio_clips) {
        if (clip.word_timestamps) expect(wordTimestampsSchema.safeParse(clip.word_timestamps).success).toBe(true);
      }
    }
  });

  it("drafts stay hidden from learners", async () => {
    const { data } = await supabase.from("entries").select("id").eq("status", "draft");
    expect(data).toEqual([]);
  });
});
