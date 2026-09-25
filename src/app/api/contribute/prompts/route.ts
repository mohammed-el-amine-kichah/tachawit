import { NextResponse } from "next/server";
import { pickPrompts } from "@/lib/contribute/prompts";
import { createSecretClient } from "@/lib/supabase/secret";
import { createServerSupabase } from "@/lib/supabase/server";

const LIMIT = 30;
const SCAN = 300;

/**
 * Words the signed-in speaker is asked to record: entries with no audio yet (drafts included,
 * since most words wait for a recording before they are published), minus the ones they already
 * sent. Only each entry's id and meaning leave the server.
 */
export async function GET() {
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return NextResponse.json({ error: "sign_in" }, { status: 401 });

  const secret = createSecretClient();
  if (!secret) return NextResponse.json({ prompts: [] });

  const [entries, sent] = await Promise.all([
    secret.from("entries").select("id, translations, audio_clips(id)").is("audio_clips", null).order("created_at").limit(SCAN),
    supabase.from("submissions").select("related_entry_id").eq("submitter_id", userId).neq("status", "rejected").not("related_entry_id", "is", null),
  ]);
  if (entries.error) {
    console.error("Recording prompts failed", entries.error.message);
    return NextResponse.json({ prompts: [] });
  }
  const alreadySent = (sent.data ?? []).flatMap((s) => (s.related_entry_id ? [s.related_entry_id] : []));
  return NextResponse.json({ prompts: pickPrompts(entries.data, alreadySent, LIMIT) }, { headers: { "Cache-Control": "private, no-store" } });
}
