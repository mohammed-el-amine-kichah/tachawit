import { unstable_cache } from "next/cache";
import { CONTENT_CACHE_TAG, CONTENT_REVALIDATE_SECONDS } from "@/lib/content/cache";
import { localizedTextSchema, type LocalizedText } from "@/lib/content/localized-text";
import { createPublicClient } from "../public";
import { createServerSupabase } from "../server";

export type PublicSpeaker = { id: string; name: string; village: string | null; region: LocalizedText | null; bio: LocalizedText | null };

const optional = (value: unknown) => {
  const parsed = localizedTextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

async function fetchSpeakers(): Promise<PublicSpeaker[]> {
  // Row level security only returns speakers who gave consent and published audio; the inner join
  // keeps speakers who have at least one published recording, not everyone who ticked consent.
  const { data, error } = await createPublicClient()
    .from("speakers")
    .select("id, display_name, village, public_bio, regions(name), audio_clips!inner(id)")
    .order("display_name");
  if (error) throw error;
  return data.map((s) => ({ id: s.id, name: s.display_name, village: s.village, region: s.regions ? optional(s.regions.name) : null, bio: optional(s.public_bio) }));
}

/** The voices of Tachawit, credited on the About page. */
export const getPublicSpeakers = unstable_cache(fetchSpeakers, ["public-speakers"], { tags: [CONTENT_CACHE_TAG], revalidate: CONTENT_REVALIDATE_SECONDS });

export type OwnSpeakerProfile = { display_name: string; region_id: string | null; village: string | null; consent_given: boolean; consent_date: string | null };

/** The signed-in member's own speaker profile (null if not a speaker yet), and their account name. */
export async function getOwnSpeakerProfile(): Promise<{ signedIn: boolean; profile: OwnSpeakerProfile | null; accountName: string }> {
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { signedIn: false, profile: null, accountName: "" };
  const [{ data: profile }, { data: account }] = await Promise.all([
    supabase.from("speakers").select("display_name, region_id, village, consent_given, consent_date").eq("id", userId).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
  ]);
  return { signedIn: true, profile, accountName: account?.display_name ?? "" };
}
