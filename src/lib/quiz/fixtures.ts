import type { AudioInfo, ViewEntry } from "@/lib/lesson/view";

export const id = (n: number) => `30000000-0000-4000-8000-00000000000${n}`;

const audio = (n: number): AudioInfo => ({
  id: `40000000-0000-4000-8000-00000000000${n}`,
  url: `https://example.test/${n}.mp3`,
  slowUrl: null,
  durationMs: 800,
  words: null,
  speaker: null,
});

export function viewEntry(n: number, latin: string, options: { arabic?: string; noAudio?: boolean } = {}): ViewEntry {
  return {
    id: id(n),
    text_latin: latin,
    text_arabic: options.arabic ?? null,
    text_tifinagh: null,
    translations: { en: `meaning ${n}` },
    partOfSpeech: null,
    regionName: null,
    imageUrl: null,
    audio: options.noAudio ? null : audio(n),
  };
}
