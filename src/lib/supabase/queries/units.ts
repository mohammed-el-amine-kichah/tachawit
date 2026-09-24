import { unstable_cache } from "next/cache";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { parseLocalizedText, type LocalizedText } from "@/lib/content/localized-text";
import { defaultUnlockRule, unlockRuleSchema, type UnlockRule } from "@/lib/content/unlock-rule";
import { createPublicClient } from "../public";
import type { Database } from "../types";

type Enums = Database["public"]["Enums"];
export type LevelType = Enums["level_type"];
export type MapTheme = Enums["map_theme"];

export type MapLevel = {
  id: string;
  position: number;
  type: LevelType;
  title: LocalizedText | null;
  unlockRule: UnlockRule;
  mapX: number;
  mapY: number;
};

export type MapUnit = {
  id: string;
  slug: string;
  position: number;
  title: LocalizedText;
  description: LocalizedText | null;
  mapTheme: MapTheme;
  levels: MapLevel[];
};

async function fetchMapUnits(): Promise<MapUnit[]> {
  const { data, error } = await createPublicClient()
    .from("units")
    .select("id, slug, position, title, description, map_theme, levels(id, position, type, title, unlock_rule, map_x, map_y)")
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
    levels: unit.levels.map((level) => {
      const rule = unlockRuleSchema.safeParse(level.unlock_rule);
      return {
        id: level.id,
        position: level.position,
        type: level.type,
        title: level.title === null ? null : parseLocalizedText(level.title),
        unlockRule: rule.success ? rule.data : defaultUnlockRule,
        mapX: level.map_x,
        mapY: level.map_y,
      };
    }),
  }));
}

/** Published units with their published levels, in journey order. */
export const getMapUnits = unstable_cache(fetchMapUnits, ["map-units"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CONTENT_REVALIDATE_SECONDS,
});
