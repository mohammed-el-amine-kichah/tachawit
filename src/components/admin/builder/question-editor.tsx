"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import type { DraftItem } from "@/lib/admin/builder";
import { splitWords } from "@/lib/audio/karaoke";
import type { EntryRow } from "@/lib/lesson/view";
import { LocalizedFields } from "../localized-fields";
import { EntriesField, EntryField } from "./entry-field";
import { draftOf, formOf } from "./localized-draft";

const ids = (value: unknown) => (Array.isArray(value) ? (value as string[]) : []);

/** Edits one quiz question. */
export function QuestionEditor({ question, rows, onChange }: { question: DraftItem; rows: Record<string, EntryRow>; onChange: (q: DraftItem) => void }) {
  const t = useTranslations("Admin.builder");
  const set = (patch: Record<string, unknown>) => onChange({ ...question, ...patch });
  const answer = String(question.entryId ?? "");

  const answerField = <EntryField label={t("answer")} value={answer} rows={rows} onChange={(entryId) => set({ entryId })} />;
  const distractors = (min: number) => (
    <EntriesField
      label={t("distractors")}
      hint={min ? t("distractorsHint") : t("distractorsOptional")}
      value={ids(question.distractorEntryIds)}
      rows={rows}
      max={5}
      onChange={(distractorEntryIds) => set({ distractorEntryIds })}
    />
  );

  const body = (() => {
    switch (question.type) {
      case "listen_pick_translation":
      case "pick_audio":
        return (
          <>
            {answerField}
            {distractors(1)}
          </>
        );
      case "build_sentence":
        return (
          <>
            {answerField}
            {distractors(0)}
          </>
        );
      case "match_pairs":
        return (
          <EntriesField label={t("pairs")} hint={t("pairsHint")} value={ids(question.entryIds)} rows={rows} max={6} onChange={(entryIds) => set({ entryIds })} />
        );
      case "fill_blank": {
        const words = answer && rows[answer] ? splitWords(rows[answer].text_latin) : [];
        return (
          <>
            {answerField}
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${question.id}-blank`}>{t("blankWord")}</Label>
              <select
                id={`${question.id}-blank`}
                dir="ltr"
                value={Number(question.blankWordIndex ?? 0)}
                onChange={(e) => set({ blankWordIndex: Number(e.target.value) })}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={words.length === 0}
              >
                {words.map((word, index) => (
                  <option key={index} value={index}>
                    {index + 1}. {word}
                  </option>
                ))}
              </select>
            </div>
            {distractors(1)}
          </>
        );
      }
      case "speak":
        return answerField;
      default:
        return null;
    }
  })();

  return (
    <div className="flex flex-col gap-5">
      {body}
      <details className="rounded-xl bg-muted/50 p-3">
        <summary className="cursor-pointer text-sm font-medium">{t("customPrompt")}</summary>
        <div className="mt-3">
          <LocalizedFields id={`${question.id}-prompt`} label={t("prompt")} value={formOf(question.prompt)} onChange={(v) => set({ prompt: draftOf(v) })} />
        </div>
      </details>
    </div>
  );
}
