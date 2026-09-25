"use client";

import { MicIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSpeakerProfile, type SpeakerProfileResult } from "@/app/actions/speaker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localize } from "@/i18n/localize";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { OwnSpeakerProfile } from "@/lib/supabase/queries/speakers";

/** A member offers their voice: how they are credited, where they are from, and their consent. */
export function SpeakerProfileForm({
  profile,
  defaultName,
  regions,
}: {
  profile: OwnSpeakerProfile | null;
  defaultName: string;
  regions: { id: string; name: LocalizedText }[];
}) {
  const t = useTranslations("Speaker");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SpeakerProfileResult | null>(null);
  const [values, setValues] = useState({
    display_name: profile?.display_name ?? defaultName,
    region_id: profile?.region_id ?? "",
    village: profile?.village ?? "",
    consent_given: profile?.consent_given ?? false,
  });
  const withdrawing = Boolean(profile?.consent_given) && !values.consent_given;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const saved = await saveSpeakerProfile(values);
          setResult(saved);
          if (saved.ok) router.refresh();
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="speaker-name">{t("name")}</Label>
        <Input
          id="speaker-name"
          required
          maxLength={80}
          value={values.display_name}
          onChange={(e) => setValues((v) => ({ ...v, display_name: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="speaker-region">{t("region")}</Label>
          <select
            id="speaker-region"
            value={values.region_id}
            onChange={(e) => setValues((v) => ({ ...v, region_id: e.target.value }))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">—</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {localize(r.name, locale)?.text}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="speaker-village">{t("village")}</Label>
          <Input
            id="speaker-village"
            maxLength={120}
            value={values.village}
            onChange={(e) => setValues((v) => ({ ...v, village: e.target.value }))}
          />
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
        <Checkbox
          checked={values.consent_given}
          onCheckedChange={(checked) => setValues((v) => ({ ...v, consent_given: checked === true }))}
          className="mt-0.5"
        />
        <span className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("consent")}</span>
          <span className="text-muted-foreground">{t("consentLead")}</span>
          {profile?.consent_given && profile.consent_date && values.consent_given && (
            <span className="text-xs text-muted-foreground">{t("consentSince", { date: profile.consent_date })}</span>
          )}
        </span>
      </label>
      {withdrawing && (
        <p role="status" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("withdrawWarning")}
        </p>
      )}
      {result && (
        <p role={result.ok ? "status" : "alert"} className={result.ok ? "text-sm text-success" : "text-sm text-destructive"}>
          {result.ok ? t("saved") : t(`errors.${result.error}`)}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        <MicIcon aria-hidden />
        {profile ? t("save") : t("become")}
      </Button>
    </form>
  );
}
