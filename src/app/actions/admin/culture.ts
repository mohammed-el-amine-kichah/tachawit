"use server";

import { z } from "zod";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { cultureFormSchema, localizedFormSchema, type CultureFormInput } from "@/lib/admin/schemas";
import { cultureCategories } from "@/lib/content/enums";
import { asAdmin } from "./run";

const id = z.uuid();

export async function createCultureNote(input: { slug: string; category: string; title: z.input<typeof localizedFormSchema> }): Promise<ActionResult> {
  const values = z
    .object({ slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), category: z.enum(cultureCategories), title: localizedFormSchema.refine((v) => Object.keys(v).length > 0) })
    .safeParse(input);
  if (!values.success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { data, error } = await supabase.from("culture_notes").insert(values.data).select("id").single();
    return error ? { ok: false, error: adminError(error) } : { ok: true, id: data.id };
  });
}

export async function saveCultureNote(noteId: string, input: CultureFormInput): Promise<ActionResult> {
  const values = cultureFormSchema.safeParse(input);
  if (!id.safeParse(noteId).success || !values.success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("culture_notes").update(values.data).eq("id", noteId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function setCultureStatus(noteId: string, next: "draft" | "published"): Promise<ActionResult> {
  if (!id.safeParse(noteId).success || !["draft", "published"].includes(next)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("culture_notes").update({ status: next }).eq("id", noteId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function deleteCultureNote(noteId: string): Promise<ActionResult> {
  if (!id.safeParse(noteId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("culture_notes").delete().eq("id", noteId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}
