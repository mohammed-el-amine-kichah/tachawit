import type { LocalizedText } from "@/lib/content/localized-text";
import { localizedTextSchema } from "@/lib/content/localized-text";

/** A word speakers are asked to record: only its meaning is shown, so they say it their own way. */
export type RecordingPrompt = { id: string; meaning: LocalizedText };

/** Entries still missing audio, minus the ones this speaker already sent, in their original order. */
export function pickPrompts(entries: readonly { id: string; translations: unknown }[], alreadySent: readonly string[], limit: number): RecordingPrompt[] {
  const sent = new Set(alreadySent);
  const prompts: RecordingPrompt[] = [];
  for (const entry of entries) {
    if (prompts.length >= limit) break;
    if (sent.has(entry.id)) continue;
    const meaning = localizedTextSchema.safeParse(entry.translations);
    if (meaning.success) prompts.push({ id: entry.id, meaning: meaning.data });
  }
  return prompts;
}
