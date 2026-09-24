import { unstable_cache } from "next/cache";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { parseLocalizedText, type LocalizedText } from "@/lib/content/localized-text";
import type { TachawitTextSource } from "@/lib/script/resolve";
import { createPublicClient } from "../public";

export type EntrySummary = TachawitTextSource & {
  id: string;
  translations: LocalizedText;
};

async function fetchPublishedEntries(): Promise<EntrySummary[]> {
  const { data, error } = await createPublicClient()
    .from("entries")
    .select("id, text_latin, text_arabic, text_tifinagh, translations")
    .order("text_latin");
  if (error) throw error;

  return data.map((entry) => ({ ...entry, translations: parseLocalizedText(entry.translations) }));
}

/** Every published word and phrase, alphabetically by Latin spelling. */
export const getPublishedEntries = unstable_cache(fetchPublishedEntries, ["published-entries"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CONTENT_REVALIDATE_SECONDS,
});
