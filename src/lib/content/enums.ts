import type { Database } from "@/lib/supabase/types";

type Enums = Database["public"]["Enums"];

/** Mirrors of database enums, for forms and validation. `satisfies` keeps them in sync with the schema. */
export const partsOfSpeech = [
  "noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction",
  "interjection", "numeral", "particle", "phrase", "expression",
] as const satisfies readonly Enums["part_of_speech"][];

export const levelTypes = ["lesson", "quiz", "review", "boss", "story"] as const satisfies readonly Enums["level_type"][];

export const mapThemes = ["aures_peaks", "cedar_forest", "cliff_villages", "palm_groves"] as const satisfies readonly Enums["map_theme"][];

export const cultureCategories = [
  "music", "jewelry", "history", "yennayer", "food", "crafts", "daily_life", "other",
] as const satisfies readonly Enums["culture_category"][];

export type PartOfSpeech = (typeof partsOfSpeech)[number];

export function isPartOfSpeech(value: unknown): value is PartOfSpeech {
  return typeof value === "string" && (partsOfSpeech as readonly string[]).includes(value);
}
