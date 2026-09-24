"use client";

import { ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSpeaker, saveSpeaker } from "@/app/actions/admin/speakers";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localize } from "@/i18n/localize";
import { getPathname } from "@/i18n/navigation";
import type { LocalizedText } from "@/lib/content/localized-text";
import { ConfirmButton } from "../confirm-button";
import { LocalizedFields, toLocalizedForm, type LocalizedFormValue } from "../localized-fields";
import { useAdminAction } from "../use-admin-action";

export type EditableSpeaker = {
  id: string;
  display_name: string;
  region_id: string | null;
  village: string | null;
  consent_given: boolean;
  consent_date: string | null;
  public_bio: LocalizedText | null;
};

/** A speaker and their recorded consent. Audio is only ever published with consent on file. */
export function SpeakerForm({ speaker, regions }: { speaker: EditableSpeaker | null; regions: { id: string; slug: string; name: LocalizedText }[] }) {
  const t = useTranslations("Admin.speakers");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [values, setValues] = useState({
    display_name: speaker?.display_name ?? "",
    region_id: speaker?.region_id ?? "",
    village: speaker?.village ?? "",
    consent_given: speaker?.consent_given ?? false,
    consent_date: speaker?.consent_date ?? "",
    bio: toLocalizedForm(speaker?.public_bio) as LocalizedFormValue,
  });
  const revoking = Boolean(speaker?.consent_given) && !values.consent_given;

  return (
    <form
      className="flex max-w-2xl flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveSpeaker(speaker?.id ?? null, values), {
          success: t("saved"),
          onSuccess: (result) => {
            if (!speaker && result.id) router.replace(getPathname({ href: `/admin/speakers/${result.id}`, locale }));
          },
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <Label htmlFor="display_name">{t("name")}</Label>
          <Input id="display_name" required maxLength={80} value={values.display_name} onChange={(e) => setValues({ ...values, display_name: e.target.value })} />
          <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="region_id">{t("region")}</Label>
          <select id="region_id" value={values.region_id} onChange={(e) => setValues({ ...values, region_id: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">—</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {localize(r.name, locale)?.text ?? r.slug}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="village">{t("village")}</Label>
          <Input id="village" value={values.village} onChange={(e) => setValues({ ...values, village: e.target.value })} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-xl bg-muted/60 p-4">
        <legend className="sr-only">{t("consent")}</legend>
        <label className="flex items-start gap-3">
          <Checkbox
            checked={values.consent_given}
            onCheckedChange={(checked) =>
              setValues({ ...values, consent_given: checked === true, consent_date: checked === true && !values.consent_date ? new Date().toISOString().slice(0, 10) : values.consent_date })
            }
            className="mt-0.5"
          />
          <span>
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheckIcon aria-hidden className="size-4 text-success" />
              {t("consent")}
            </span>
            <span className="text-sm text-muted-foreground">{t("consentHint")}</span>
          </span>
        </label>
        {values.consent_given && (
          <div className="flex flex-col gap-1 sm:w-60">
            <Label htmlFor="consent_date">{t("consentDate")}</Label>
            <Input id="consent_date" type="date" required value={values.consent_date} onChange={(e) => setValues({ ...values, consent_date: e.target.value })} />
          </div>
        )}
        {revoking && <p className="text-sm font-medium text-destructive">{t("revokeWarning")}</p>}
      </fieldset>

      <LocalizedFields id="bio" label={t("bio")} multiline value={values.bio} onChange={(bio) => setValues({ ...values, bio })} />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {speaker ? t("save") : t("create")}
        </Button>
        {speaker && (
          <ConfirmButton
            trigger={
              <Button type="button" variant="ghost" disabled={pending}>
                <Trash2Icon aria-hidden />
                {t("delete")}
              </Button>
            }
            title={t("deleteTitle")}
            description={t("deleteLead")}
            confirmLabel={t("delete")}
            onConfirm={() => run(() => deleteSpeaker(speaker.id), { success: t("deleted"), onSuccess: () => router.push(getPathname({ href: "/admin/speakers", locale })) })}
          />
        )}
      </div>
    </form>
  );
}
