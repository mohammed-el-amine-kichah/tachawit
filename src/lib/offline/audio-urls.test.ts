import { describe, expect, it } from "vitest";
import { audioUrlsIn } from "./audio-urls";

const clip = (name: string, slow = false) => ({
  id: name,
  url: `https://x.supabase.co/storage/v1/object/public/audio/${name}.mp3`,
  slowUrl: slow ? `https://x.supabase.co/storage/v1/object/public/audio/${name}-slow.mp3` : null,
  durationMs: 900,
  words: null,
  speaker: null,
});

describe("audioUrlsIn", () => {
  it("finds every clip in a lesson or quiz, slow versions included, once each", () => {
    const view = {
      steps: [
        { type: "word", entry: { audio: clip("azul", true), imageUrl: "https://x.supabase.co/storage/v1/object/public/images/a.png" } },
        { type: "dialogue", lines: [{ audio: clip("tanmirt") }, { audio: clip("azul", true) }] },
      ],
      glossary: { a: { audio: clip("aman") }, b: { audio: null } },
    };
    expect(audioUrlsIn(view)).toEqual([
      "https://x.supabase.co/storage/v1/object/public/audio/azul.mp3",
      "https://x.supabase.co/storage/v1/object/public/audio/azul-slow.mp3",
      "https://x.supabase.co/storage/v1/object/public/audio/tanmirt.mp3",
      "https://x.supabase.co/storage/v1/object/public/audio/aman.mp3",
    ]);
  });

  it("ignores images and anything that is not a published audio file", () => {
    expect(audioUrlsIn({ url: "https://evil.test/a.mp3", imageUrl: "x" })).toEqual([]);
    expect(audioUrlsIn(null)).toEqual([]);
  });
});
