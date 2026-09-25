import { LogInIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { RecordingSession } from "@/components/contribute/recording-session";
import { Motif } from "@/components/shared/motif";
import { SpeakerProfileForm } from "@/components/speaker/speaker-profile-form";
import { Button } from "@/components/ui/button";
import { getPathname, Link } from "@/i18n/navigation";
import { localize } from "@/i18n/localize";
import { getRegions } from "@/lib/supabase/queries/regions";
import { getOwnSpeakerProfile } from "@/lib/supabase/queries/speakers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contribute");
  return { title: t("title"), description: t("lead") };
}

async function loadRegions() {
  try {
    return await getRegions();
  } catch {
    return [];
  }
}

/** Sign in, set up your voice once (details and consent), then record word after word. */
export default async function ContributePage() {
  const t = await getTranslations("Contribute");
  const locale = await getLocale();
  const [speaker, regions] = await Promise.all([getOwnSpeakerProfile(), loadRegions()]);
  const ready = speaker.profile?.consent_given === true;
  const region = regions.find((r) => r.id === speaker.profile?.region_id);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground sm:text-lg">{t("lead")}</p>
      <Motif variant="zigzag" className="my-5 max-w-40" />

      {!speaker.signedIn ? (
        <section className="flex flex-col items-start gap-3 rounded-3xl bg-card p-5 shadow-soft ring-1 ring-border">
          <h2 className="text-xl font-semibold">{t("signInTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("signInLead")}</p>
          <Button asChild size="lg">
            <Link href={{ pathname: "/login", query: { next: getPathname({ href: "/contribute", locale }) } }}>
              <LogInIcon aria-hidden />
              {t("signIn")}
            </Link>
          </Button>
        </section>
      ) : !ready ? (
        <section className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-soft ring-1 ring-border">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">{t("setupTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("setupLead")}</p>
          </div>
          <SpeakerProfileForm profile={speaker.profile} defaultName={speaker.accountName} regions={regions} />
          {speaker.profile && <p className="text-sm text-muted-foreground">{t("setupConsent")}</p>}
        </section>
      ) : (
        <>
          <p className="mb-4 flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-medium">{t("recordingAs", { name: speaker.profile?.display_name ?? "" })}</span>
            <span className="text-muted-foreground">
              {[region ? localize(region.name, locale)?.text : null, speaker.profile?.village].filter(Boolean).join(" · ")}
            </span>
            <Link href="/profile" className="text-primary underline underline-offset-4">
              {t("change")}
            </Link>
          </p>
          <RecordingSession />
        </>
      )}
    </div>
  );
}
