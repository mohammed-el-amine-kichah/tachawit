import { unstable_cache } from "next/cache";
import { z } from "zod";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { localizedTextSchema, parseLocalizedText, type LocalizedText } from "@/lib/content/localized-text";
import { createPublicClient } from "../public";
import type { Database } from "../types";

export type CultureCategory = Database["public"]["Enums"]["culture_category"];

export type CultureCard = {
  id: string;
  slug: string;
  category: CultureCategory;
  title: LocalizedText;
  summary: LocalizedText | null;
  coverPath: string | null;
};

export type CultureArticle = CultureCard & {
  body: LocalizedText;
  unit: { title: LocalizedText } | null;
};

const bodySchema = z.partialRecord(z.enum(["en", "fr", "ar", "dz"]), z.string()).catch({});
const optional = (value: unknown) => {
  const parsed = localizedTextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

async function fetchCultureList(): Promise<CultureCard[]> {
  const { data, error } = await createPublicClient()
    .from("culture_notes")
    .select("id, slug, category, title, summary, cover_image_path")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: parseLocalizedText(row.title),
    summary: optional(row.summary),
    coverPath: row.cover_image_path,
  }));
}

async function fetchCultureArticle(slug: string): Promise<CultureArticle | null> {
  const { data, error } = await createPublicClient()
    .from("culture_notes")
    .select("id, slug, category, title, summary, body, cover_image_path, units(title, status)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    category: data.category,
    title: parseLocalizedText(data.title),
    summary: optional(data.summary),
    coverPath: data.cover_image_path,
    body: bodySchema.parse(data.body),
    unit: data.units ? { title: parseLocalizedText(data.units.title) } : null,
  };
}

/** Published culture articles, newest first. */
export const getCultureList = unstable_cache(fetchCultureList, ["culture-list"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CONTENT_REVALIDATE_SECONDS,
});

/** One published article by its slug. */
export const getCultureArticle = unstable_cache(fetchCultureArticle, ["culture-article"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CONTENT_REVALIDATE_SECONDS,
});
