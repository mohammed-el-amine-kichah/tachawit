import { unstable_cache } from "next/cache";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { localizedTextSchema, type LocalizedText } from "@/lib/content/localized-text";
import { createPublicClient } from "../public";

export type PublicSpeaker = { id: string; name: string; village: string | null; region: LocalizedText | null; bio: LocalizedText | null };

const optional = (value: unknown) => {
  const parsed = localizedTextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

async function fetchSpeakers(): Promise<PublicSpeaker[]> {
  // Row level security only returns speakers who gave consent.
  const { data, error } = await createPublicClient().from("speakers").select("id, display_name, village, public_bio, regions(name)").order("display_name");
  if (error) throw error;
  return data.map((s) => ({ id: s.id, name: s.display_name, village: s.village, region: s.regions ? optional(s.regions.name) : null, bio: optional(s.public_bio) }));
}

/** The voices of Tachawit, credited on the About page. */
export const getPublicSpeakers = unstable_cache(fetchSpeakers, ["public-speakers"], { tags: [CONTENT_CACHE_TAG], revalidate: CONTENT_REVALIDATE_SECONDS });
