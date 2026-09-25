"use client";

import { Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCultureNote, saveCultureNote, setCultureCover, setCultureStatus } from "@/app/actions/admin/culture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localize } from "@/i18n/localize";
import { getPathname } from "@/i18n/navigation";
import { cultureCategories } from "@/lib/content/enums";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { CultureCategory } from "@/lib/supabase/queries/culture";
import { ConfirmButton } from "../confirm-button";
import { EditorStatusBar } from "../editor-status-bar";
import { ImageField } from "../entries/image-field";
import { LocalizedFields } from "../localized-fields";
import { toLocalizedForm, type LocalizedFormValue } from "../localized-form";
import { StatusBadge } from "../status-badge";
import { useAdminAction } from "../use-admin-action";
import { useUnsavedGuard } from "../use-unsaved-guard";
import { MarkdownEditor } from "./markdown-editor";
import { ChoiceSelect } from "../choice-select";

const LANGS = [
  { key: "en", lang: "en", dir: "ltr" },
  { key: "fr", lang: "fr", dir: "ltr" },
  { key: "ar", lang: "ar", dir: "rtl" },
] as const;

export type EditableNote = {
  id: string;
  slug: string;
  category: CultureCategory;
  title: LocalizedText;
  summary: LocalizedText | null;
  body: Partial<LocalizedFormValue>;
  cover_image_path: string | null;
  unit_id: string | null;
  status: "draft" | "published";
};

export function CultureEditor({ note, units }: { note: EditableNote; units: { id: string; title: LocalizedText }[] }) {
  const t = useTranslations("Admin.culture");
  const langs = useTranslations("Admin.languages");
  const cats = useTranslations("Culture.categories");
  const img = useTranslations("Admin.image");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [values, setValues] = useState(() => ({
    slug: note.slug,
    category: note.category,
    title: toLocalizedForm(note.title),
    summary: toLocalizedForm(note.summary),
    body: toLocalizedForm(note.body),
    cover_image_path: note.cover_image_path ?? "",
    unit_id: note.unit_id ?? "",
  }));
  const json = JSON.stringify(values);
  const [savedJson, setSavedJson] = useState(json);
  const dirty = json !== savedJson;
  const markSaved = () => setSavedJson(json);
  useUnsavedGuard(dirty);

  // Publishing or unpublishing keeps unsaved edits instead of silently dropping them.
  const saveThenSetStatus = async (next: "draft" | "published") => {
    const saved = await saveCultureNote(note.id, values);
    return saved.ok ? setCultureStatus(note.id, next) : saved;
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveCultureNote(note.id, values), { success: t("saved"), onSuccess: markSaved });
      }}
    >
      <EditorStatusBar status={<StatusBadge status={note.status} />} saveState={pending ? "saving" : dirty ? "unsaved" : "saved"}>
        <Button type="submit" disabled={pending || !dirty}>
          {t("save")}
        </Button>
        {note.status === "draft" ? (
          <Button
            type="button"
            disabled={pending}
            className="bg-success text-success-foreground hover:bg-success/90"
            onClick={() => run(() => saveThenSetStatus("published"), { success: t("published"), onSuccess: markSaved })}
          >
            {t("publish")}
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => saveThenSetStatus("draft"), { success: t("unpublished"), onSuccess: markSaved })}>
            {t("unpublish")}
          </Button>
        )}
        <ConfirmButton
          trigger={
            <Button type="button" variant="ghost" size="icon" aria-label={t("delete")}>
              <Trash2Icon aria-hidden />
            </Button>
          }
          title={t("deleteTitle")}
          description={t("deleteLead")}
          confirmLabel={t("delete")}
          onConfirm={() => run(() => deleteCultureNote(note.id), { success: t("deleted"), onSuccess: () => router.push(getPathname({ href: "/admin/culture", locale })) })}
        />
      </EditorStatusBar>

      <LocalizedFields id="culture-title" label={t("title")} required value={values.title} onChange={(title) => setValues({ ...values, title })} />
      <LocalizedFields id="culture-summary" label={t("summary")} multiline value={values.summary} onChange={(summary) => setValues({ ...values, summary })} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="culture-category">{t("category")}</Label>
          <ChoiceSelect
            id="culture-category"
            value={values.category}
            onChange={(v) => v && setValues({ ...values, category: v })}
            options={cultureCategories.map((c) => ({ value: c, label: cats(c) }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="culture-slug">{t("slug")}</Label>
          <Input id="culture-slug" dir="ltr" value={values.slug} onChange={(e) => setValues({ ...values, slug: e.target.value.toLowerCase() })} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="culture-unit">{t("unit")}</Label>
          <ChoiceSelect
            id="culture-unit"
            value={values.unit_id}
            onChange={(v) => setValues({ ...values, unit_id: v })}
            noneLabel="—"
            options={units.map((u) => ({ value: u.id, label: localize(u.title, locale)?.text ?? u.id.slice(0, 8) }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>{t("cover")}</Label>
        <ImageField
          folder="culture"
          value={values.cover_image_path}
          onChange={(cover_image_path) => {
            setValues({ ...values, cover_image_path });
            // The cover saves on its own; it shouldn't leave the rest of the form looking unsaved.
            run(() => setCultureCover(note.id, cover_image_path || null), {
              success: img(cover_image_path ? "attached" : "removed"),
              onSuccess: () => setSavedJson((saved) => JSON.stringify({ ...JSON.parse(saved), cover_image_path })),
            });
          }}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("body")}</legend>
        <Tabs defaultValue={locale}>
          <TabsList>
            {LANGS.map(({ key }) => (
              <TabsTrigger key={key} value={key}>
                {langs(key)}
              </TabsTrigger>
            ))}
          </TabsList>
          {LANGS.map(({ key, lang, dir }) => (
            <TabsContent key={key} value={key}>
              <MarkdownEditor
                id={`body-${key}`}
                lang={lang}
                dir={dir}
                value={values.body[key]}
                onChange={(text) => setValues({ ...values, body: { ...values.body, [key]: text } })}
              />
            </TabsContent>
          ))}
        </Tabs>
      </fieldset>
    </form>
  );
}
