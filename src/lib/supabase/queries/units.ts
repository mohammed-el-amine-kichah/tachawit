import { unstable_cache } from "next/cache";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { parseLocalizedText, type LocalizedText } from "@/lib/content/localized-text";
import { createPublicClient } from "../public";
import type { Database } from "../types";

type Enums = Database["public"]["Enums"];

export type LevelSummary = {
  id: string;
  position: number;
  type: Enums["level_type"];
  title: LocalizedText | null;
};

export type UnitSummary = {
  id: string;
  slug: string;
  position: number;
  title: LocalizedText;
  description: LocalizedText | null;
  mapTheme: Enums["map_theme"];
  levels: LevelSummary[];
};

async function fetchPublishedUnits(): Promise<UnitSummary[]> {
  const { data, error } = await createPublicClient()
    .from("units")
    .select("id, slug, position, title, description, map_theme, levels(id, position, type, title)")
    .order("position")
    .order("position", { referencedTable: "levels" });
  if (error) throw error;

  return data.map((unit) => ({
    id: unit.id,
    slug: unit.slug,
    position: unit.position,
    title: parseLocalizedText(unit.title),
    description: unit.description === null ? null : parseLocalizedText(unit.description),
    mapTheme: unit.map_theme,
    levels: unit.levels.map((level) => ({
      id: level.id,
      position: level.position,
      type: level.type,
      title: level.title === null ? null : parseLocalizedText(level.title),
    })),
  }));
}

/** Published units with their published levels, in map order. */
export const getPublishedUnits = unstable_cache(fetchPublishedUnits, ["published-units"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CONTENT_REVALIDATE_SECONDS,
});
