import { unstable_cache } from "next/cache";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import type { ResourcePlatform } from "@/lib/content/enums";
import { parseLocalizedText, type LocalizedText } from "@/lib/content/localized-text";
import { platformOfUrl } from "@/lib/resources/platform";
import { createPublicClient } from "../public";

export type Resource = { id: string; platform: ResourcePlatform; name: string; url: string; summary: LocalizedText };

async function fetchResources(): Promise<Resource[]> {
  const { data, error } = await createPublicClient()
    .from("resources")
    .select("id, platform, name, url, summary")
    .order("published_at", { ascending: false });
  if (error) throw error;
  // Links are checked again here so a row edited outside the admin panel can never send learners elsewhere.
  return data
    .filter((row) => platformOfUrl(row.url) === row.platform)
    .map((row) => ({ id: row.id, platform: row.platform, name: row.name, url: row.url, summary: parseLocalizedText(row.summary) }));
}

/** Published learning resources, newest first. */
export const getResources = unstable_cache(fetchResources, ["resources"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CONTENT_REVALIDATE_SECONDS,
});
