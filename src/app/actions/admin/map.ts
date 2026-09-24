"use server";

import { z } from "zod";
import { nextNodePosition } from "@/lib/admin/builder";
import { imagePathSchema } from "@/lib/admin/image-path";
import { adminError, type ActionResult } from "@/lib/admin/result";
import { levelFormSchema, unitFormSchema, type LevelFormInput, type UnitFormInput } from "@/lib/admin/schemas";
import { levelTypes } from "@/lib/content/enums";
import { asAdmin } from "./run";

const id = z.uuid();
const statusSchema = z.enum(["draft", "published"]);

export async function saveUnit(unitId: string | null, input: UnitFormInput): Promise<ActionResult> {
  const values = unitFormSchema.safeParse(input);
  if (!values.success || (unitId !== null && !id.safeParse(unitId).success)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    if (unitId) {
      const { error } = await supabase.from("units").update(values.data).eq("id", unitId);
      return error ? { ok: false, error: adminError(error) } : { ok: true, id: unitId };
    }
    const { data: last } = await supabase.from("units").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await supabase
      .from("units")
      .insert({ ...values.data, position: (last?.position ?? -1) + 1 })
      .select("id")
      .single();
    return error ? { ok: false, error: adminError(error) } : { ok: true, id: data.id };
  });
}

/** Attaches (or removes) the cover as soon as it is uploaded, without saving the rest of the form. */
export async function setUnitCover(unitId: string, path: string | null): Promise<ActionResult> {
  const cover = imagePathSchema("units").safeParse(path);
  if (!id.safeParse(unitId).success || !cover.success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("units").update({ cover_image_path: cover.data }).eq("id", unitId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function setUnitStatus(unitId: string, next: "draft" | "published"): Promise<ActionResult> {
  if (!id.safeParse(unitId).success || !statusSchema.safeParse(next).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("units").update({ status: next }).eq("id", unitId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

/** Deleting a unit removes its levels too; only drafts can be deleted. */
export async function deleteUnit(unitId: string): Promise<ActionResult> {
  if (!id.safeParse(unitId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { data: unit } = await supabase.from("units").select("status").eq("id", unitId).single();
    if (unit?.status === "published") return { ok: false, error: "in_use" };
    const { error } = await supabase.from("units").delete().eq("id", unitId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function reorderUnits(unitIds: string[]): Promise<ActionResult> {
  if (!z.array(id).safeParse(unitIds).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.rpc("reorder_units", { p_unit_ids: unitIds });
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function createLevel(unitId: string, type: (typeof levelTypes)[number]): Promise<ActionResult> {
  if (!id.safeParse(unitId).success || !levelTypes.includes(type)) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { data: levels, error: readError } = await supabase
      .from("levels")
      .select("position, map_x, map_y")
      .eq("unit_id", unitId)
      .order("position");
    if (readError) return { ok: false, error: adminError(readError) };
    const place = nextNodePosition(levels.map((l) => ({ x: l.map_x, y: l.map_y })));
    const { data, error } = await supabase
      .from("levels")
      .insert({ unit_id: unitId, type, position: (levels.at(-1)?.position ?? -1) + 1, map_x: place.x, map_y: place.y })
      .select("id")
      .single();
    return error ? { ok: false, error: adminError(error) } : { ok: true, id: data.id };
  });
}

export async function saveLevel(levelId: string, input: LevelFormInput): Promise<ActionResult> {
  const values = levelFormSchema.safeParse(input);
  if (!id.safeParse(levelId).success || !values.success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("levels").update(values.data).eq("id", levelId);
    return error ? { ok: false, error: adminError(error, "content") } : { ok: true };
  });
}

export async function setLevelStatus(levelId: string, next: "draft" | "published"): Promise<ActionResult> {
  if (!id.safeParse(levelId).success || !statusSchema.safeParse(next).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("levels").update({ status: next }).eq("id", levelId);
    return error ? { ok: false, error: adminError(error, "content") } : { ok: true };
  });
}

export async function deleteLevel(levelId: string): Promise<ActionResult> {
  if (!id.safeParse(levelId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.from("levels").delete().eq("id", levelId);
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function reorderLevels(unitId: string, levelIds: string[]): Promise<ActionResult> {
  if (!id.safeParse(unitId).success || !z.array(id).safeParse(levelIds).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.rpc("reorder_levels", { p_unit_id: unitId, p_level_ids: levelIds });
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

export async function moveLevel(levelId: string, unitId: string): Promise<ActionResult> {
  if (!id.safeParse(levelId).success || !id.safeParse(unitId).success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    const { error } = await supabase.rpc("move_level", { p_level_id: levelId, p_unit_id: unitId });
    return error ? { ok: false, error: adminError(error) } : { ok: true };
  });
}

const positionsSchema = z.array(z.object({ id, x: z.number().min(0).max(1), y: z.number().min(0).max(1) })).max(200);

/** Saves node positions from the map editor (normalised 0..1 within the unit). */
export async function saveLevelPositions(positions: { id: string; x: number; y: number }[]): Promise<ActionResult> {
  const parsed = positionsSchema.safeParse(positions);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return asAdmin(async ({ supabase }) => {
    for (const { id: levelId, x, y } of parsed.data) {
      const { error } = await supabase.from("levels").update({ map_x: x, map_y: y }).eq("id", levelId);
      if (error) return { ok: false, error: adminError(error) };
    }
    return { ok: true };
  });
}
