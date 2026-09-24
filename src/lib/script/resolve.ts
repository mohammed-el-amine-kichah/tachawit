import type { Direction } from "@/i18n/config";
import { scriptMeta, type Script } from "./scripts";

export type TachawitTextSource = {
  text_latin: string;
  text_arabic?: string | null;
  text_tifinagh?: string | null;
};

export type ResolvedTachawitText = {
  text: string;
  script: Script;
  requested: Script;
  isFallback: boolean;
  dir: Direction;
  lang: string;
};

function textIn(source: TachawitTextSource, script: Script): string | null | undefined {
  switch (script) {
    case "latin":
      return source.text_latin;
    case "arabic":
      return source.text_arabic;
    case "tifinagh":
      return source.text_tifinagh;
  }
}

/** Returns the text in the requested script, falling back to Latin. Text is never altered. */
export function resolveTachawitText(source: TachawitTextSource, requested: Script): ResolvedTachawitText {
  const candidate = textIn(source, requested);
  const script: Script = candidate && candidate.trim() !== "" ? requested : "latin";
  return {
    text: script === requested ? (candidate as string) : source.text_latin,
    script,
    requested,
    isFallback: script !== requested,
    ...scriptMeta[script],
  };
}
