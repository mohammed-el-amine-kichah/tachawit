"use client";

import { Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCultureNote, saveCultureNote, setCultureStatus } from "@/app/actions/admin/culture";
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
import { ImageField } from "../entries/image-field";
import { LocalizedFields } from "../localized-fields";
import { toLocalizedForm, type LocalizedFormValue } from "../localized-form";
import { StatusBadge } from "../status-badge";
import { useAdminAction } from "../use-admin-action";
import { MarkdownEditor } from "./markdown-editor";

const LANGS = [
  { key: "en", lang: "en", dir: "ltr" },
  { key: "fr", lang: "fr", dir: "ltr" },
  { key: "ar", lang: "ar", dir: "rtl" },
  { key: "dz", lang: "ar-DZ", dir: "rtl" },
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
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [values, setValues] = useState({
    slug: note.slug,
    category: note.category,
    title: toLocalizedForm(note.title),
    summary: toLocalizedForm(note.summary),
    body: toLocalizedForm(note.body),
    cover_image_path: note.cover_image_path ?? "",
    unit_id: note.unit_id ?? "",
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveCultureNote(note.id, values), { success: t("saved") });
      }}
    >
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
        <StatusBadge status={note.status} />
        <div className="ms-auto flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {t("save")}
          </Button>
          {note.status === "draft" ? (
            <Button
              type="button"
              disabled={pending}
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={() => run(() => setCultureStatus(note.id, "published"), { success: t("published") })}
            >
              {t("publish")}
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => setCultureStatus(note.id, "draft"), { success: t("unpublished") })}>
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
        </div>
      </div>

      <LocalizedFields id="culture-title" label={t("title")} required value={values.title} onChange={(title) => setValues({ ...values, title })} />
      <LocalizedFields id="culture-summary" label={t("summary")} multiline value={values.summary} onChange={(summary) => setValues({ ...values, summary })} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="culture-category">{t("category")}</Label>
          <select id="culture-category" value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value as CultureCategory })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            {cultureCategories.map((c) => (
              <option key={c} value={c}>
                {cats(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="culture-slug">{t("slug")}</Label>
          <Input id="culture-slug" dir="ltr" value={values.slug} onChange={(e) => setValues({ ...values, slug: e.target.value.toLowerCase() })} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="culture-unit">{t("unit")}</Label>
          <select id="culture-unit" value={values.unit_id} onChange={(e) => setValues({ ...values, unit_id: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">—</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {localize(u.title, locale)?.text}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>{t("cover")}</Label>
        <ImageField folder="culture" value={values.cover_image_path} onChange={(cover_image_path) => setValues({ ...values, cover_image_path })} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("body")}</legend>
        <Tabs defaultValue={locale === "ar-DZ" ? "dz" : locale}>
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
