"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveEntry, type EntryOption } from "@/app/actions/admin/entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyLocalized, type LocalizedFormValue } from "../localized-form";

const LANGUAGES = ["en", "fr", "ar"] as const satisfies readonly (keyof LocalizedFormValue)[];

/** A new draft word with just its spelling and one meaning, created without leaving the current editor. */
export function QuickEntryForm({ initialLatin, onCreated, onCancel }: { initialLatin: string; onCreated: (entry: EntryOption) => void; onCancel: () => void }) {
  const t = useTranslations("Admin.picker");
  const languages = useTranslations("Admin.languages");
  const errors = useTranslations("Admin.errors");
  const locale = useLocale();
  const id = useId();
  const language = LANGUAGES.find((l) => l === locale) ?? "en";
  const [latin, setLatin] = useState(initialLatin);
  const [meaning, setMeaning] = useState("");
  const [pending, startTransition] = useTransition();

  const create = () =>
    startTransition(async () => {
      const translations = { ...emptyLocalized, [language]: meaning };
      const result = await saveEntry(null, { text_latin: latin, text_arabic: "", text_tifinagh: "", translations, part_of_speech: "", region_id: "", notes: "", image_path: "" });
      if (!result.ok || !result.id) return void toast.error(errors(result.ok ? "failed" : result.error));
      toast.success(t("created"));
      onCreated({ id: result.id, text_latin: latin, translations: { [language]: meaning.trim() }, status: "draft" });
    });

  return (
    <form
      className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3"
      onSubmit={(event) => {
        // The picker may sit inside another form (through a portal); keep this submit to itself.
        event.preventDefault();
        event.stopPropagation();
        create();
      }}
    >
      <p className="text-sm font-medium">{t("newWord")}</p>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-latin`}>{t("latin")}</Label>
        <Input id={`${id}-latin`} lang="shy-Latn" dir="ltr" required value={latin} onChange={(e) => setLatin(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-meaning`}>{t("meaningIn", { language: languages(language) })}</Label>
        <Input id={`${id}-meaning`} lang={language} dir={language === "ar" ? "rtl" : "ltr"} required value={meaning} onChange={(e) => setMeaning(e.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">{t("newWordHint")}</p>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || !latin.trim() || !meaning.trim()}>
          {t("createDraft")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
