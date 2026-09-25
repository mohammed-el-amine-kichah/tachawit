import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { OwnSpeakerProfile } from "@/lib/supabase/queries/speakers";
import { SpeakerProfileForm } from "./speaker-profile-form";

/** Profile section where any member can lend their voice to Tachawit. */
export async function SpeakerSection({
  signedIn,
  profile,
  defaultName,
  regions,
}: {
  signedIn: boolean;
  profile: OwnSpeakerProfile | null;
  defaultName: string;
  regions: { id: string; name: LocalizedText }[];
}) {
  const t = await getTranslations("Speaker");
  return (
    <section aria-labelledby="speaker-title" className="mt-6 flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-soft ring-1 ring-border">
      <div className="flex flex-col gap-1">
        <h2 id="speaker-title" className="text-xl font-semibold">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {signedIn ? (
        <SpeakerProfileForm profile={profile} defaultName={defaultName} regions={regions} />
      ) : (
        <p className="text-sm">
          <Link href="/login" className="font-medium text-primary underline underline-offset-4">
            {t("signIn")}
          </Link>
        </p>
      )}
    </section>
  );
}
