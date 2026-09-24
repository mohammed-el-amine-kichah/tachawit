import { unstable_cache } from "next/cache";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { parseLocalizedText, type LocalizedText } from "@/lib/content/localized-text";
import { createPublicClient } from "../public";

async function fetchRegions(): Promise<{ id: string; name: LocalizedText }[]> {
  const { data, error } = await createPublicClient().from("regions").select("id, name").order("slug");
  if (error) throw error;
  return data.map((r) => ({ id: r.id, name: parseLocalizedText(r.name) }));
}

export const getRegions = unstable_cache(fetchRegions, ["regions"], { tags: [CONTENT_CACHE_TAG], revalidate: CONTENT_REVALIDATE_SECONDS });
