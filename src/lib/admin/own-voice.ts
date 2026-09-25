import "server-only";
import type { OwnVoice } from "@/components/admin/audio/audio-uploader";
import { getOwnSpeakerProfile } from "@/lib/supabase/queries/speakers";

/** The signed-in admin's speaker profile, which their recordings are credited to (null if not a speaker yet). */
export async function ownVoice(): Promise<OwnVoice | null> {
  const { profile } = await getOwnSpeakerProfile();
  return profile ? { name: profile.display_name, consent: profile.consent_given } : null;
}
