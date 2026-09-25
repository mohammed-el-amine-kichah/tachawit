import { ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { localize } from "@/i18n/localize";
import { listSpeakers } from "@/lib/admin/queries";
import { localizedTextSchema } from "@/lib/content/localized-text";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("speakers") };
}

export default async function SpeakersPage() {
  const t = await getTranslations("Admin.speakers");
  const locale = await getLocale();
  const speakers = await listSpeakers();
  return (
    <>
      {/* Read only: speakers sign up and give or withdraw consent from their own profile. */}
      <PageHeader title={t("title")} description={t("lead")} />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {speakers.map((s) => {
          const region = s.regions ? localizedTextSchema.safeParse(s.regions.name) : null;
          return (
            <li key={s.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
              <p className="font-semibold">{s.display_name}</p>
              <p className="text-sm text-muted-foreground">
                {[s.village, region?.success ? localize(region.data, locale)?.text : null].filter(Boolean).join(" · ") || "—"}
              </p>
              <p className="mt-2 flex items-center gap-1 text-sm">
                {s.consent_given ? (
                  <>
                    <ShieldCheckIcon aria-hidden className="size-4 text-success" />
                    {t("consentOn", { date: s.consent_date ?? "" })}
                  </>
                ) : (
                  <>
                    <ShieldAlertIcon aria-hidden className="size-4 text-destructive" />
                    {t("consentMissing")}
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{t("recordings", { count: s.audio_clips.length })}</p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
