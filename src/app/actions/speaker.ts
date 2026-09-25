"use server";

import { speakerProfileSchema, type SpeakerProfileInput } from "@/lib/speakers/profile";
import { createServerSupabase } from "@/lib/supabase/server";

export type SpeakerProfileResult = { ok: true } | { ok: false; error: "sign_in" | "invalid" | "failed" };

/** Creates or updates the signed-in member's own speaker profile, including their consent. */
export async function saveSpeakerProfile(input: SpeakerProfileInput): Promise<SpeakerProfileResult> {
  const values = speakerProfileSchema.safeParse(input);
  if (!values.success) return { ok: false, error: "invalid" };

  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return { ok: false, error: "sign_in" };

  const { error } = await supabase.from("speakers").upsert({ id: userId, ...values.data });
  if (error) {
    console.error("Speaker profile save failed", error.message);
    return { ok: false, error: "failed" };
  }
  return { ok: true };
}
