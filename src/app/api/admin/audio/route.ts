import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AdminAccessError, requireAdmin } from "@/lib/admin/guard";
import { convertRecording } from "@/lib/audio/convert";
import { clampTrim } from "@/lib/audio/ffmpeg";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  originalPath: z.string().regex(/^uploads\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/),
  startMs: z.number().nonnegative(),
  endMs: z.number().positive(),
  durationMs: z.number().positive(),
  entryId: z.uuid().nullable(),
});

/**
 * Turns an original recording (already uploaded to the private "audio-originals" bucket by the
 * admin) into web-friendly and slow versions, then creates a draft clip credited to that admin as
 * the speaker. Admins only.
 */
export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    throw error;
  }

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { originalPath, entryId, durationMs } = body.data;
  const trim = clampTrim(body.data.startMs, body.data.endMs, durationMs);
  const { supabase, userId } = admin;

  // Admins record in their own voice, so they need their own speaker profile.
  const { data: speaker } = await supabase.from("speakers").select("id").eq("id", userId).maybeSingle();
  if (!speaker) return NextResponse.json({ error: "no_speaker" }, { status: 409 });

  const download = await supabase.storage.from("audio-originals").download(originalPath);
  if (download.error) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let converted;
  try {
    converted = await convertRecording(await download.data.arrayBuffer(), trim);
  } catch (error) {
    console.error("Audio conversion failed", error);
    return NextResponse.json({ error: "conversion" }, { status: 422 });
  }

  const base = `clips/${randomUUID()}`;
  const upload = (path: string, file: Buffer) =>
    supabase.storage.from("audio").upload(path, file, { contentType: "audio/mp4", cacheControl: "31536000", upsert: false });
  const [normal, slow] = await Promise.all([upload(`${base}.m4a`, converted.normal), upload(`${base}-slow.m4a`, converted.slow)]);
  if (normal.error || slow.error) return NextResponse.json({ error: "failed" }, { status: 500 });

  const hasPrimary = entryId
    ? ((await supabase.from("audio_clips").select("id", { count: "exact", head: true }).eq("entry_id", entryId).eq("is_primary", true)).count ?? 0) > 0
    : true;

  const { data, error } = await supabase
    .from("audio_clips")
    .insert({
      entry_id: entryId,
      speaker_id: userId,
      storage_path: `${base}.m4a`,
      slow_storage_path: `${base}-slow.m4a`,
      original_path: originalPath,
      mime_type: "audio/mp4",
      duration_ms: trim.endMs - trim.startMs,
      is_primary: !hasPrimary,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) {
    await supabase.storage.from("audio").remove([`${base}.m4a`, `${base}-slow.m4a`]);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
