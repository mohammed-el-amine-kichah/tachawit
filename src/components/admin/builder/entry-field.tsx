"use client";

import { XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { localize } from "@/i18n/localize";
import { localizedTextSchema } from "@/lib/content/localized-text";
import type { EntryRow } from "@/lib/lesson/view";
import { EntryPicker } from "../audio/entry-picker";

function EntryChip({ row, id, onRemove }: { row: EntryRow | undefined; id: string; onRemove?: () => void }) {
  const locale = useLocale();
  const t = useTranslations("Admin.builder");
  const meaning = row ? localizedTextSchema.safeParse(row.translations) : null;
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-sm">
      <span className="font-semibold" dir="ltr">
        {row?.text_latin ?? id.slice(0, 8)}
      </span>
      {meaning?.success && <span className="text-muted-foreground">{localize(meaning.data, locale)?.text}</span>}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={t("remove")} className="rounded p-0.5 hover:bg-background">
          <XIcon aria-hidden className="size-3.5" />
        </button>
      )}
    </span>
  );
}

function PickerDialog({ trigger, onPick }: { trigger: React.ReactNode; onPick: (id: string) => void }) {
  const t = useTranslations("Admin.builder");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("chooseEntry")}</DialogTitle>
        </DialogHeader>
        <EntryPicker
          autoFocus
          onPick={(entry) => {
            onPick(entry.id);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/** One word or phrase, chosen from the dictionary. */
export function EntryField({ label, value, rows, onChange }: { label: string; value: string; rows: Record<string, EntryRow>; onChange: (id: string) => void }) {
  const t = useTranslations("Admin.builder");
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {value ? <EntryChip id={value} row={rows[value]} /> : <span className="text-sm text-muted-foreground">{t("noneChosen")}</span>}
        <PickerDialog
          onPick={onChange}
          trigger={
            <Button type="button" variant="outline" size="sm">
              {value ? t("change") : t("choose")}
            </Button>
          }
        />
      </div>
    </div>
  );
}

/** Several entries (answer choices, pairs), each chosen from the dictionary. */
export function EntriesField({
  label,
  hint,
  value,
  rows,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string[];
  rows: Record<string, EntryRow>;
  max: number;
  onChange: (ids: string[]) => void;
}) {
  const t = useTranslations("Admin.builder");
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <div className="flex flex-wrap items-center gap-2">
        {value.map((id) => (
          <EntryChip key={id} id={id} row={rows[id]} onRemove={() => onChange(value.filter((v) => v !== id))} />
        ))}
        {value.length < max && (
          <PickerDialog
            onPick={(id) => !value.includes(id) && onChange([...value, id])}
            trigger={
              <Button type="button" variant="outline" size="sm">
                {t("add")}
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

export { EntryChip };
