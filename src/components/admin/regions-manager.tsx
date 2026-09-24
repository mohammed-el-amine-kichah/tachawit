"use client";

import { Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { deleteRegion, saveRegion } from "@/app/actions/admin/speakers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localize } from "@/i18n/localize";
import type { LocalizedText } from "@/lib/content/localized-text";
import { ConfirmButton } from "./confirm-button";
import { emptyLocalized, LocalizedFields } from "./localized-fields";
import { useAdminAction } from "./use-admin-action";

/** Regions and villages used to tag dialect variation on entries and speakers. */
export function RegionsManager({ regions }: { regions: { id: string; slug: string; name: LocalizedText }[] }) {
  const t = useTranslations("Admin.regions");
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState(emptyLocalized);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ul className="flex flex-col gap-2">
        {regions.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-card px-4 py-3 ring-1 ring-border">
            <span>
              <span className="font-medium">{localize(r.name, locale)?.text}</span>
              <span className="ms-2 text-xs text-muted-foreground" dir="ltr">
                {r.slug}
              </span>
            </span>
            <ConfirmButton
              trigger={
                <Button variant="ghost" size="icon" aria-label={t("delete")} disabled={pending}>
                  <Trash2Icon aria-hidden />
                </Button>
              }
              title={t("deleteTitle")}
              description={t("deleteLead")}
              confirmLabel={t("delete")}
              onConfirm={() => run(() => deleteRegion(r.id), { success: t("deleted") })}
            />
          </li>
        ))}
      </ul>
      <form
        className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => saveRegion(null, { slug, name }), {
            success: t("added"),
            onSuccess: () => {
              setSlug("");
              setName(emptyLocalized);
            },
          });
        }}
      >
        <h2 className="font-sans text-lg font-semibold">{t("add")}</h2>
        <div className="flex flex-col gap-1">
          <Label htmlFor="slug">{t("slug")}</Label>
          <Input id="slug" dir="ltr" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} />
          <p className="text-xs text-muted-foreground">{t("slugHint")}</p>
        </div>
        <LocalizedFields id="region-name" label={t("name")} required value={name} onChange={setName} />
        <Button type="submit" disabled={pending} className="self-start">
          {t("add")}
        </Button>
      </form>
    </div>
  );
}
