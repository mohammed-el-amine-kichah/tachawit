"use server";

import { z } from "zod";
import { contentKeys } from "@/i18n/config";
import { parseCsv, rowsToEntries, type ImportError } from "@/lib/admin/csv";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { entryFormSchema, type EntryFormInput } from "@/lib/admin/schemas";
import { asAdmin } from "./run";

const id = z.uuid();
const status = z.enum(["draft", "published"]);

export async function saveEntry(entryId: string | null, input: EntryFormInput): Promise<ActionResult> {
  const values = entryFormSchema.safeParse(input);
  if (!values.success || (entryId !== null && !id.safeParse(entryId).success)) return { ok: false, error: "invalid" };

  return asAdmin(async ({ supabase }) => {
    const query = entryId
      ? supabase.from("entries").update(values.data).eq("id", entryId).select("id").single()
      : supabase.from("entries").insert(values.data).select("id").single();
    const { data, error } = await query;
    if (error) return { ok: false, error: adminError(error, "entry") };
    return { ok: true, id: data.id };
  });
}

export async function setEntryStatus(entryId: string, next: "draft" | "published"): Promise<ActionResult> {
  if (!id.safeParse(entryId).success || !status.safeParse(next).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("entries").update({ status: next }).eq("id", entryId);
    return error ? { ok: false, error: adminError(error, "entry") } : { ok: true };
  });
}

export async function deleteEntry(entryId: string): Promise<ActionResult> {
  if (!id.safeParse(entryId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("entries").delete().eq("id", entryId);
    return error ? { ok: false, error: adminError(error, "entry") } : { ok: true };
  });
}

/** Imports a CSV as draft entries. Validated again here: the browser preview is only a convenience. */
export async function importEntries(csv: string): Promise<ActionResult<{ imported: number; errors: ImportError[] }>> {
  if (typeof csv !== "string" || csv.length > 2_000_000) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { data: regions, error: regionError } = await supabase.from("regions").select("id, slug");
    if (regionError) return { ok: false, error: adminError(regionError) };
    const { entries, errors } = rowsToEntries(parseCsv(csv), Object.fromEntries(regions.map((r) => [r.slug, r.id])));
    if (entries.length) {
      const { error } = await supabase.from("entries").insert(entries);
      if (error) return { ok: false, error: adminError(error) };
    }
    return { ok: true, data: { imported: entries.length, errors } };
  });
}

export type EntryOption = { id: string; text_latin: string; translations: unknown; status: "draft" | "published" };

/** Entry picker search for admin editors (drafts included). */
export async function searchEntries(query: string): Promise<EntryOption[]> {
  const term = String(query ?? "").replace(/[%,().*\\]/g, " ").trim().slice(0, 60);
  const result = await asAdmin(async ({ supabase }) => {
    let request = supabase.from("entries").select("id, text_latin, translations, status").order("text_latin").limit(20);
    if (term) {
      const like = `*${term}*`;
      request = request.or([`text_latin.ilike.${like}`, ...contentKeys.map((k) => `translations->>${k}.ilike.${like}`)].join(","));
    }
    const { data } = await request;
    return data ?? [];
  }, { invalidate: false });
  return Array.isArray(result) ? result : [];
}
