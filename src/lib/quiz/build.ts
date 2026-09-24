import { splitWords } from "@/lib/audio/karaoke";
import type { QuizQuestion } from "@/lib/content/quiz";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { AudioInfo, ViewEntry } from "@/lib/lesson/view";
import { seedFrom, seededRandom, shuffled } from "@/lib/random";
import { resolveTachawitText } from "@/lib/script/resolve";
import type { Script } from "@/lib/script/scripts";

// Questions (content JSON) become playable items. Anything that cannot be played properly,
// such as a missing entry or an audio option without audio, is dropped rather than shown broken.

type WithAudio = ViewEntry & { audio: AudioInfo };

export type QuizItem =
  | { id: string; type: "listen_pick_translation"; prompt: LocalizedText | null; answer: WithAudio; options: ViewEntry[] }
  | { id: string; type: "pick_audio"; prompt: LocalizedText | null; answer: ViewEntry; options: WithAudio[] }
  | { id: string; type: "build_sentence"; prompt: LocalizedText | null; answer: ViewEntry; distractors: ViewEntry[] }
  | { id: string; type: "match_pairs"; prompt: LocalizedText | null; pairs: WithAudio[]; meanings: WithAudio[] }
  | {
      id: string;
      type: "fill_blank";
      prompt: LocalizedText | null;
      answer: ViewEntry;
      blankWordIndex: number;
      distractors: ViewEntry[];
    }
  | { id: string; type: "speak"; prompt: LocalizedText | null; answer: ViewEntry };

const hasAudio = (entry: ViewEntry | undefined): entry is WithAudio => Boolean(entry?.audio);

export function buildQuizItems(
  questions: readonly QuizQuestion[],
  entries: Readonly<Record<string, ViewEntry>>,
  seed: number,
): QuizItem[] {
  return questions.flatMap((question): QuizItem[] => {
    const random = seededRandom(seed ^ seedFrom(question.id));
    const prompt = question.prompt ?? null;
    const lookup = (ids: readonly string[] = []) => ids.map((id) => entries[id]).filter((e): e is ViewEntry => Boolean(e));

    switch (question.type) {
      case "listen_pick_translation": {
        const answer = entries[question.entryId];
        const distractors = lookup(question.distractorEntryIds);
        if (!hasAudio(answer) || distractors.length === 0) return [];
        return [{ id: question.id, type: question.type, prompt, answer, options: shuffled([answer, ...distractors], random) }];
      }
      case "pick_audio": {
        const answer = entries[question.entryId];
        const distractors = lookup(question.distractorEntryIds).filter(hasAudio);
        if (!hasAudio(answer) || distractors.length === 0) return [];
        return [{ id: question.id, type: question.type, prompt, answer, options: shuffled([answer, ...distractors], random) }];
      }
      case "build_sentence": {
        const answer = entries[question.entryId];
        if (!answer) return [];
        return [{ id: question.id, type: question.type, prompt, answer, distractors: lookup(question.distractorEntryIds) }];
      }
      case "match_pairs": {
        const pairs = lookup(question.entryIds).filter(hasAudio);
        if (pairs.length < 2) return [];
        return [{ id: question.id, type: question.type, prompt, pairs: shuffled(pairs, random), meanings: shuffled(pairs, random) }];
      }
      case "fill_blank": {
        const answer = entries[question.entryId];
        const distractors = lookup(question.distractorEntryIds);
        if (!answer || distractors.length === 0) return [];
        return [
          { id: question.id, type: question.type, prompt, answer, blankWordIndex: question.blankWordIndex, distractors },
        ];
      }
      case "speak": {
        const answer = entries[question.entryId];
        return answer ? [{ id: question.id, type: question.type, prompt, answer }] : [];
      }
    }
  });
}

const wordsIn = (entry: ViewEntry, script: Script) => splitWords(resolveTachawitText(entry, script).text);

export type Tile = { id: string; text: string };

/** Word tiles for "build the sentence": the answer's words plus words from the distractors. */
export function buildTiles(answer: ViewEntry, distractors: readonly ViewEntry[], script: Script, seed: number) {
  const answerWords = wordsIn(answer, script);
  const extra = [...new Set(distractors.flatMap((d) => wordsIn(d, script)))].filter((w) => !answerWords.includes(w));
  const tiles: Tile[] = [...answerWords, ...extra].map((text, i) => ({ id: `t${i}`, text }));
  return { answer: answerWords, tiles: shuffled(tiles, seededRandom(seed)) };
}

export type Blank = { before: string[]; after: string[]; answer: string; options: string[]; script: Script };

/**
 * "Fill in the missing word" in the learner's script. If that script's spelling does not have the
 * word at the same position, falls back to Latin; returns null if the position does not exist.
 */
export function buildBlank(
  answer: ViewEntry,
  blankWordIndex: number,
  distractors: readonly ViewEntry[],
  script: Script,
  seed: number,
): Blank | null {
  const latinCount = splitWords(answer.text_latin).length;
  const usable = wordsIn(answer, script).length === latinCount ? script : "latin";
  const words = wordsIn(answer, usable);
  if (blankWordIndex >= words.length) return null;

  const missing = words[blankWordIndex];
  const others = [...new Set(distractors.map((d) => wordsIn(d, usable)[0]).filter((w): w is string => Boolean(w) && w !== missing))];
  return {
    before: words.slice(0, blankWordIndex),
    after: words.slice(blankWordIndex + 1),
    answer: missing,
    options: shuffled([missing, ...others], seededRandom(seed)),
    script: usable,
  };
}
