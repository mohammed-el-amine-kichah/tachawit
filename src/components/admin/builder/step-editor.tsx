"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localize } from "@/i18n/localize";
import type { DraftItem } from "@/lib/admin/builder";
import { localizedTextSchema } from "@/lib/content/localized-text";
import type { EntryRow } from "@/lib/lesson/view";
import { ImageField } from "../entries/image-field";
import { LocalizedFields } from "../localized-fields";
import { EntryField } from "./entry-field";
import { draftOf, formOf } from "./localized-draft";
import { ChoiceSelect } from "../choice-select";

type Line = { speaker: string; entryId: string };
export type NoteOption = { id: string; slug: string; title: unknown };

/** Edits one lesson step. */
export function StepEditor({
  step,
  rows,
  notes,
  onChange,
}: {
  step: DraftItem;
  rows: Record<string, EntryRow>;
  notes: NoteOption[];
  onChange: (step: DraftItem) => void;
}) {
  const t = useTranslations("Admin.builder");
  const locale = useLocale();
  const set = (patch: Record<string, unknown>) => onChange({ ...step, ...patch });

  switch (step.type) {
    case "introduce":
    case "listen_repeat":
      return <EntryField label={t("entry")} value={String(step.entryId ?? "")} rows={rows} onChange={(entryId) => set({ entryId })} />;

    case "culture_note":
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${step.id}-note`}>{t("linkedNote")}</Label>
            <ChoiceSelect
              id={`${step.id}-note`}
              value={String(step.cultureNoteId ?? "")}
              onChange={(v) => set({ cultureNoteId: v || undefined })}
              noneLabel={t("noLinkedNote")}
              options={notes.map((note) => {
                const title = localizedTextSchema.safeParse(note.title);
                return { value: note.id, label: (title.success ? localize(title.data, locale)?.text : null) ?? note.slug };
              })}
            />
            <p className="text-xs text-muted-foreground">{t("linkedNoteHint")}</p>
          </div>
          <LocalizedFields id={`${step.id}-title`} label={t("noteTitle")} value={formOf(step.title)} onChange={(v) => set({ title: draftOf(v) })} />
          <LocalizedFields id={`${step.id}-body`} label={t("noteBody")} multiline value={formOf(step.body)} onChange={(v) => set({ body: draftOf(v) })} />
          <div className="flex flex-col gap-1">
            <Label>{t("image")}</Label>
            <ImageField folder="lessons" value={String(step.imagePath ?? "")} onChange={(path) => set({ imagePath: path || undefined })} />
          </div>
        </div>
      );

    case "dialogue": {
      const lines = (Array.isArray(step.lines) ? step.lines : []) as Line[];
      const setLines = (next: Line[]) => set({ lines: next });
      return (
        <div className="flex flex-col gap-4">
          <LocalizedFields id={`${step.id}-title`} label={t("dialogueTitle")} value={formOf(step.title)} onChange={(v) => set({ title: draftOf(v) })} />
          <ol className="flex flex-col gap-3">
            {lines.map((line, index) => (
              <li key={index} className="flex flex-wrap items-end gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex w-24 flex-col gap-1">
                  <Label htmlFor={`${step.id}-speaker-${index}`}>{t("speaker")}</Label>
                  <Input
                    id={`${step.id}-speaker-${index}`}
                    value={line.speaker}
                    maxLength={40}
                    onChange={(e) => setLines(lines.map((l, i) => (i === index ? { ...l, speaker: e.target.value } : l)))}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <EntryField
                    label={t("line", { number: index + 1 })}
                    value={line.entryId}
                    rows={rows}
                    onChange={(entryId) => setLines(lines.map((l, i) => (i === index ? { ...l, entryId } : l)))}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={t("removeLine")} onClick={() => setLines(lines.filter((_, i) => i !== index))}>
                  <Trash2Icon aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => setLines([...lines, { speaker: lines.length % 2 === 0 ? "A" : "B", entryId: "" }])}
          >
            <PlusIcon aria-hidden />
            {t("addLine")}
          </Button>
        </div>
      );
    }

    default:
      return null;
  }
}
