"use server";

import { z } from "zod";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { localizedFormSchema } from "@/lib/admin/schemas";
import { lessonStepsSchema } from "@/lib/content/lesson";
import { quizQuestionsSchema } from "@/lib/content/quiz";
import type { EntryRow } from "@/lib/lesson/view";
import type { Json } from "@/lib/supabase/types";
import { ENTRY_WITH_AUDIO } from "@/lib/supabase/queries/entry-select";
import { asAdmin } from "./run";

// Lessons and quizzes. Drafts may be saved incomplete (autosave); publishing, and saving a
// lesson or quiz that is already published, require the full schema learners rely on.

type Kind = "lesson" | "quiz";
const id = z.uuid();
const draftItems = z.array(z.looseObject({ id: z.string().min(1).max(40), type: z.string() })).max(200);
const titleSchema = localizedFormSchema.refine((value) => Object.keys(value).length > 0);

const table = (kind: Kind) => (kind === "lesson" ? "lessons" : "quizzes");
const strict = (kind: Kind) => (kind === "lesson" ? lessonStepsSchema : quizQuestionsSchema);

type Admin = Parameters<Parameters<typeof asAdmin>[0]>[0];
type Patch = { title?: Json; items?: Json; status?: "draft" | "published" };

async function readContent({ supabase }: Admin, kind: Kind, contentId: string) {
  if (kind === "lesson") {
    const { data, error } = await supabase.from("lessons").select("status, steps").eq("id", contentId).single();
    return error ? { error } : { status: data.status, items: data.steps as unknown };
  }
  const { data, error } = await supabase.from("quizzes").select("status, questions").eq("id", contentId).single();
  return error ? { error } : { status: data.status, items: data.questions as unknown };
}

function writeContent({ supabase }: Admin, kind: Kind, contentId: string, patch: Patch) {
  const common = { ...(patch.title !== undefined && { title: patch.title }), ...(patch.status && { status: patch.status }) };
  return kind === "lesson"
    ? supabase.from("lessons").update({ ...common, ...(patch.items !== undefined && { steps: patch.items }) }).eq("id", contentId)
    : supabase.from("quizzes").update({ ...common, ...(patch.items !== undefined && { questions: patch.items }) }).eq("id", contentId);
}

export async function createContent(kind: Kind, title: z.input<typeof localizedFormSchema>): Promise<ActionResult> {
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success || !["lesson", "quiz"].includes(kind)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { data, error } = await supabase.from(table(kind)).insert({ title: parsed.data }).select("id").single();
    return error ? { ok: false, error: adminError(error) } : { ok: true, id: data.id };
  });
}

export async function saveContent(
  kind: Kind,
  contentId: string,
  input: { title: z.input<typeof localizedFormSchema>; items: unknown[] },
): Promise<ActionResult> {
  const title = titleSchema.safeParse(input.title);
  const items = draftItems.safeParse(input.items);
  if (!id.safeParse(contentId).success || !title.success || !items.success) return { ok: false, error: "invalid" };

  return asAdmin(async (admin) => {
    const current = await readContent(admin, kind, contentId);
    if ("error" in current) return { ok: false, error: adminError(current.error) };
    if (current.status === "published") {
      const valid = strict(kind).safeParse(items.data);
      if (!valid.success || valid.data.length === 0) return { ok: false, error: "invalid" };
    }
    const { error } = await writeContent(admin, kind, contentId, { title: title.data, items: items.data as Json });
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function setContentStatus(kind: Kind, contentId: string, next: "draft" | "published"): Promise<ActionResult> {
  if (!id.safeParse(contentId).success || !["draft", "published"].includes(next)) return { ok: false, error: "invalid" };
  return asAdmin(async (admin) => {
    if (next === "published") {
      const current = await readContent(admin, kind, contentId);
      if ("error" in current) return { ok: false, error: adminError(current.error) };
      const items = strict(kind).safeParse(current.items);
      if (!items.success || items.data.length === 0) return { ok: false, error: "invalid" };
    }
    const { error } = await writeContent(admin, kind, contentId, { status: next });
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function deleteContent(kind: Kind, contentId: string): Promise<ActionResult> {
  if (!id.safeParse(contentId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from(table(kind)).delete().eq("id", contentId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

/** Entries (drafts included, with every clip) for the builder's live preview. */
export async function loadPreviewEntries(ids: string[]): Promise<EntryRow[]> {
  const parsed = z.array(z.uuid()).max(200).safeParse(ids);
  if (!parsed.success || parsed.data.length === 0) return [];
  const result = await asAdmin(
    async ({ supabase }) => {
      const { data } = await supabase.from("entries").select(ENTRY_WITH_AUDIO).in("id", parsed.data).returns<EntryRow[]>();
      return data ?? [];
    },
    { invalidate: false },
  );
  return Array.isArray(result) ? result : [];
}
