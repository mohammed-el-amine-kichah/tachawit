import { MapPinIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocalizedContent } from "@/components/shared/localized-content";
import { Badge } from "@/components/ui/badge";
import type { ViewEntry } from "@/lib/lesson/view";

const PARTS = [
  "noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction",
  "interjection", "numeral", "particle", "phrase", "expression",
] as const;

function isPart(value: string | null): value is (typeof PARTS)[number] {
  return value !== null && (PARTS as readonly string[]).includes(value);
}

/** Part of speech and the region the word was recorded in (dialect variation is shown, not hidden). */
export function EntryTags({ entry }: { entry: ViewEntry }) {
  const t = useTranslations("PartOfSpeech");
  const part = entry.partOfSpeech;
  if (!isPart(part) && !entry.regionName) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {isPart(part) && <Badge variant="outline">{t(part)}</Badge>}
      {entry.regionName && (
        <Badge variant="secondary" className="gap-1">
          <MapPinIcon aria-hidden className="size-3" />
          <LocalizedContent value={entry.regionName} />
        </Badge>
      )}
    </div>
  );
}
