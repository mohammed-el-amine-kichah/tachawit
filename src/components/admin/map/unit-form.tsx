"use client";

import { Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteUnit, saveUnit, setUnitCover, setUnitStatus } from "@/app/actions/admin/map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPathname } from "@/i18n/navigation";
import { mapThemes } from "@/lib/content/enums";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { MapTheme } from "@/lib/supabase/queries/units";
import { ConfirmButton } from "../confirm-button";
import { ImageField } from "../entries/image-field";
import { LocalizedFields, toLocalizedForm } from "../localized-fields";
import { StatusBadge } from "../status-badge";
import { useAdminAction } from "../use-admin-action";

export type EditableUnit = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText | null;
  map_theme: MapTheme;
  cover_image_path: string | null;
  status: "draft" | "published";
};

export function UnitForm({ unit }: { unit: EditableUnit }) {
  const t = useTranslations("Admin.map");
  const themes = useTranslations("MapTheme");
  const img = useTranslations("Admin.image");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [values, setValues] = useState({
    slug: unit.slug,
    title: toLocalizedForm(unit.title),
    description: toLocalizedForm(unit.description),
    map_theme: unit.map_theme,
    cover_image_path: unit.cover_image_path ?? "",
  });

  // Publishing or unpublishing keeps unsaved edits instead of silently dropping them.
  const saveThenSetStatus = async (next: "draft" | "published") => {
    const saved = await saveUnit(unit.id, values);
    return saved.ok ? setUnitStatus(unit.id, next) : saved;
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveUnit(unit.id, values), { success: t("unitSaved") });
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={unit.status} />
        <div className="ms-auto flex gap-2">
          {unit.status === "draft" ? (
            <Button
              type="button"
              className="bg-success text-success-foreground hover:bg-success/90"
              disabled={pending}
              onClick={() => run(() => saveThenSetStatus("published"), { success: t("unitPublished") })}
            >
              {t("publishUnit")}
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => saveThenSetStatus("draft"), { success: t("unitUnpublished") })}>
              {t("unpublishUnit")}
            </Button>
          )}
          {unit.status === "draft" && (
            <ConfirmButton
              trigger={
                <Button type="button" variant="ghost" size="icon" aria-label={t("deleteUnit")}>
                  <Trash2Icon aria-hidden />
                </Button>
              }
              title={t("deleteUnitTitle")}
              description={t("deleteUnitLead")}
              confirmLabel={t("deleteUnit")}
              onConfirm={() => run(() => deleteUnit(unit.id), { success: t("unitDeleted"), onSuccess: () => router.push(getPathname({ href: "/admin/units", locale })) })}
            />
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t("publishHint")}</p>
      <LocalizedFields id="unit-title" label={t("unitTitle")} required value={values.title} onChange={(title) => setValues({ ...values, title })} />
      <LocalizedFields id="unit-description" label={t("unitDescription")} multiline value={values.description} onChange={(description) => setValues({ ...values, description })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="unit-theme">{t("theme")}</Label>
          <select id="unit-theme" value={values.map_theme} onChange={(e) => setValues({ ...values, map_theme: e.target.value as MapTheme })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            {mapThemes.map((theme) => (
              <option key={theme} value={theme}>
                {themes(theme)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="unit-slug">{t("slug")}</Label>
          <Input id="unit-slug" dir="ltr" value={values.slug} onChange={(e) => setValues({ ...values, slug: e.target.value.toLowerCase() })} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label>{t("cover")}</Label>
        <ImageField
          folder="units"
          value={values.cover_image_path}
          onChange={(cover_image_path) => {
            setValues({ ...values, cover_image_path });
            run(() => setUnitCover(unit.id, cover_image_path || null), { success: img(cover_image_path ? "attached" : "removed") });
          }}
        />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {t("saveUnit")}
      </Button>
    </form>
  );
}
