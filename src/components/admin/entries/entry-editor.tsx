"use client";

import { SparklesIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteEntry, saveEntry, setEntryStatus } from "@/app/actions/admin/entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { localize } from "@/i18n/localize";
import { getPathname } from "@/i18n/navigation";
import { latinToTifinagh } from "@/lib/admin/tifinagh";
import type { AdminClip } from "@/lib/admin/queries";
import type { EntryFormInput } from "@/lib/admin/schemas";
import { isPartOfSpeech, partsOfSpeech } from "@/lib/content/enums";
import type { LocalizedText } from "@/lib/content/localized-text";
import { getPublicStorageUrl } from "@/lib/supabase/storage";
import { ConfirmButton } from "../confirm-button";
import { EditorStatusBar } from "../editor-status-bar";
import { LocalizedFields, toLocalizedForm, type LocalizedFormValue } from "../localized-fields";
import { StatusBadge } from "../status-badge";
import { useUnsavedGuard } from "../use-unsaved-guard";
import { EntryPreview, previewTranslations } from "./entry-preview";
import { ImageField } from "./image-field";
import { ChoiceSelect } from "../choice-select";

type Region = { id: string; slug: string; name: LocalizedText };

export type EditableEntry = {
  id: string;
  text_latin: string;
  text_arabic: string | null;
  text_tifinagh: string | null;
  translations: LocalizedText;
  part_of_speech: string | null;
  region_id: string | null;
  notes: string | null;
  image_path: string | null;
  status: "draft" | "published";
};

type FormValues = EntryFormInput & { translations: LocalizedFormValue };

function toForm(entry: EditableEntry | null): FormValues {
  return {
    text_latin: entry?.text_latin ?? "",
    text_arabic: entry?.text_arabic ?? "",
    text_tifinagh: entry?.text_tifinagh ?? "",
    translations: toLocalizedForm(entry?.translations),
    part_of_speech: isPartOfSpeech(entry?.part_of_speech) ? entry.part_of_speech : "",
    region_id: entry?.region_id ?? "",
    notes: entry?.notes ?? "",
    image_path: entry?.image_path ?? "",
  };
}

/** Create or edit a word or phrase. Drafts save themselves; publishing is always explicit. */
export function EntryEditor({ entry, clips, regions }: { entry: EditableEntry | null; clips: AdminClip[]; regions: Region[] }) {
  const t = useTranslations("Admin.entries");
  const e = useTranslations("Admin.errors");
  const p = useTranslations("Admin.publish");
  const pos = useTranslations("PartOfSpeech");
  const locale = useLocale();
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => toForm(entry));
  const [saved, setSaved] = useState<FormValues>(() => toForm(entry));
  const [saving, startSaving] = useTransition();
  const [changing, startChanging] = useTransition();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const draft = entry?.status !== "published";
  const latest = useRef(values);
  useUnsavedGuard(dirty && (!entry || !draft));

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  const save = (quiet: boolean) => {
    const snapshot = latest.current;
    startSaving(async () => {
      const result = await saveEntry(entry?.id ?? null, snapshot);
      if (!result.ok) {
        if (!quiet || result.error !== "invalid") toast.error(e(result.error));
        return;
      }
      setSaved(snapshot);
      if (!entry && result.id) router.replace(getPathname({ href: `/admin/entries/${result.id}`, locale }));
      else if (!quiet) toast.success(t("saved"));
    });
  };

  useEffect(() => {
    latest.current = values;
  }, [values]);

  // Autosave drafts a moment after the last change.
  useEffect(() => {
    if (!entry || !draft || !dirty) return;
    const timer = setTimeout(() => save(true), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save reads the latest values through a ref
  }, [values, entry, draft, dirty]);

  const changeStatus = (next: "draft" | "published") =>
    startChanging(async () => {
      if (dirty) {
        const result = await saveEntry(entry!.id, latest.current);
        if (!result.ok) return void toast.error(e(result.error));
        setSaved(latest.current);
      }
      const result = await setEntryStatus(entry!.id, next);
      if (!result.ok) return void toast.error(e(result.error));
      toast.success(next === "published" ? t("publishedToast") : t("unpublishedToast"));
      router.refresh();
    });

  const remove = () =>
    startChanging(async () => {
      const result = await deleteEntry(entry!.id);
      if (!result.ok) return void toast.error(e(result.error));
      toast.success(t("deleted"));
      router.push(getPathname({ href: "/admin/entries", locale }));
    });

  const primary = clips.find((c) => c.isPrimary) ?? clips[0];
  const audible = clips.some((c) => c.status === "published" && c.speaker?.consent);
  const previewEntry = {
    id: entry?.id ?? "new",
    text_latin: values.text_latin,
    text_arabic: values.text_arabic || null,
    text_tifinagh: values.text_tifinagh || null,
    translations: previewTranslations(values.translations),
    partOfSpeech: values.part_of_speech || null,
    regionName: regions.find((r) => r.id === values.region_id)?.name ?? null,
    imageUrl: values.image_path ? getPublicStorageUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, "images", values.image_path) : null,
    audio: primary?.audio ?? null,
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          save(false);
        }}
      >
        <EditorStatusBar
          status={entry ? <StatusBadge status={entry.status} /> : <span className="text-sm font-medium">{t("new")}</span>}
          saveState={!entry ? null : saving ? "saving" : !dirty ? "saved" : draft ? "pending" : "unsaved"}
          notices={
            entry &&
            !audible && (
              <span className="flex items-center gap-1 text-sm">
                <TriangleAlertIcon aria-hidden className="size-4 text-gold-foreground dark:text-gold" />
                {p("entryNoAudio")}
              </span>
            )
          }
        >
          {(!entry || !draft) && (
            <Button type="submit" disabled={saving || (!!entry && !dirty)}>
              {entry ? t("saveChanges") : t("create")}
            </Button>
          )}
          {entry &&
            (draft ? (
              <Button type="button" onClick={() => changeStatus("published")} disabled={changing} className="bg-success text-success-foreground hover:bg-success/90">
                {t("publish")}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => changeStatus("draft")} disabled={changing}>
                {t("unpublish")}
              </Button>
            ))}
          {entry && (
            <ConfirmButton
              trigger={
                <Button type="button" variant="ghost" size="icon" aria-label={t("delete")} disabled={changing}>
                  <Trash2Icon aria-hidden />
                </Button>
              }
              title={t("deleteTitle")}
              description={t("deleteLead")}
              confirmLabel={t("delete")}
              onConfirm={remove}
            />
          )}
        </EditorStatusBar>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1 sm:col-span-3">
            <Label htmlFor="text_latin">{t("latin")}</Label>
            <Input id="text_latin" lang="shy-Latn" dir="ltr" required value={values.text_latin} onChange={(ev) => set("text_latin", ev.target.value)} className="h-12 text-xl" />
            <p className="text-xs text-muted-foreground">{t("latinHint")}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="text_arabic">{t("arabic")}</Label>
            <Input id="text_arabic" lang="shy-Arab" dir="rtl" value={values.text_arabic} onChange={(ev) => set("text_arabic", ev.target.value)} className="h-11 font-arabic text-lg" />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="text_tifinagh">{t("tifinagh")}</Label>
            <div className="flex gap-2">
              <Input id="text_tifinagh" lang="shy-Tfng" dir="ltr" value={values.text_tifinagh} onChange={(ev) => set("text_tifinagh", ev.target.value)} className="h-11 font-tifinagh text-lg" />
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={!values.text_latin.trim()}
                onClick={() => set("text_tifinagh", latinToTifinagh(values.text_latin))}
                title={t("suggestTifinaghHint")}
              >
                <SparklesIcon aria-hidden />
                {t("suggestTifinagh")}
              </Button>
            </div>
          </div>
        </div>

        <LocalizedFields id="translations" label={t("translations")} required value={values.translations} onChange={(v) => set("translations", v)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="part_of_speech">{t("partOfSpeech")}</Label>
            <ChoiceSelect
              id="part_of_speech"
              value={values.part_of_speech}
              onChange={(v) => set("part_of_speech", v)}
              noneLabel={t("none")}
              options={partsOfSpeech.map((p) => ({ value: p, label: pos(p) }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="region_id">{t("region")}</Label>
            <ChoiceSelect
              id="region_id"
              value={values.region_id}
              onChange={(v) => set("region_id", v)}
              noneLabel={t("none")}
              options={regions.map((r) => ({ value: r.id, label: localize(r.name, locale)?.text ?? r.slug }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label>{t("image")}</Label>
          <ImageField folder="entries" value={values.image_path} onChange={(path) => set("image_path", path)} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="notes">{t("notes")}</Label>
          <Textarea id="notes" value={values.notes} onChange={(ev) => set("notes", ev.target.value)} rows={3} />
          <p className="text-xs text-muted-foreground">{t("notesHint")}</p>
        </div>
      </form>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <EntryPreview entry={previewEntry} audio={primary?.audio ?? null} />
      </aside>
    </div>
  );
}
