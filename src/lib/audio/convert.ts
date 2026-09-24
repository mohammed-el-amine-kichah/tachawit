import "server-only";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import { conversionArgs } from "./ffmpeg";

const run = promisify(execFile);

/** Converts an uploaded recording into the web and slow versions (AAC in MP4). */
export async function convertRecording(original: ArrayBuffer, trim: { startMs: number; endMs: number }) {
  if (!ffmpegPath) throw new Error("ffmpeg is not available on this server");
  const dir = await mkdtemp(join(tmpdir(), "tachawit-audio-"));
  try {
    const input = join(dir, `${randomUUID()}.input`);
    const normal = join(dir, "normal.m4a");
    const slow = join(dir, "slow.m4a");
    await writeFile(input, Buffer.from(original));
    await run(ffmpegPath, conversionArgs({ input, output: normal, ...trim, slow: false }), { timeout: 45_000 });
    await run(ffmpegPath, conversionArgs({ input, output: slow, ...trim, slow: true }), { timeout: 45_000 });
    return { normal: await readFile(normal), slow: await readFile(slow) };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
