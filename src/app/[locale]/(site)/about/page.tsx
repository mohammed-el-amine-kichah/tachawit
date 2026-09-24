import { AudioLinesIcon, HeartHandshakeIcon, MicIcon, MountainIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LocalizedContent } from "@/components/shared/localized-content";
import { Motif } from "@/components/shared/motif";
import { ZMark } from "@/components/shared/z-mark";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getPublicSpeakers, type PublicSpeaker } from "@/lib/supabase/queries/speakers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("About");
  return { title: t("title"), description: t("lead") };
}

async function loadSpeakers(): Promise<PublicSpeaker[]> {
  try {
    return await getPublicSpeakers();
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const t = await getTranslations("About");
  const speakers = await loadSpeakers();
  const pillars = [
    { icon: AudioLinesIcon, key: "voices" },
    { icon: MountainIcon, key: "place" },
    { icon: HeartHandshakeIcon, key: "community" },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ZMark className="size-12 text-primary" />
      <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 text-xl text-muted-foreground">{t("lead")}</p>
      <Motif variant="band" className="my-8" />

      <div className="flex flex-col gap-4 text-lg leading-relaxed">
        <p>{t("story1")}</p>
        <p>{t("story2")}</p>
        <p>{t("story3")}</p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        {pillars.map(({ icon: Icon, key }) => (
          <li key={key} className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
            <Icon aria-hidden className="size-7 text-primary" />
            <h2 className="mt-3 font-sans text-lg font-semibold">{t(`pillars.${key}.title`)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t(`pillars.${key}.body`)}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="voices" className="mt-12">
        <h2 id="voices" className="text-3xl font-semibold">
          {t("voicesTitle")}
        </h2>
        <p className="mt-2 text-muted-foreground">{t("voicesLead")}</p>
        {speakers.length === 0 ? (
          <p className="mt-6 text-muted-foreground">{t("voicesSoon")}</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {speakers.map((s) => (
              <li key={s.id} className="flex gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                  <MicIcon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.village}
                    {s.village && s.region ? " · " : null}
                    <LocalizedContent value={s.region} />
                  </p>
                  <LocalizedContent value={s.bio} as="p" className="mt-2 text-sm" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="join" className="mt-12 overflow-hidden rounded-3xl bg-secondary text-secondary-foreground">
        <Motif variant="band" className="h-3" />
        <div className="flex flex-col gap-3 p-6">
          <h2 id="join" className="text-2xl font-semibold">
            {t("joinTitle")}
          </h2>
          <p>{t("joinLead")}</p>
          <Button asChild variant="secondary" className="self-start bg-background text-foreground hover:bg-background/90">
            <Link href="/contribute">{t("joinButton")}</Link>
          </Button>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">{t("contentNote")}</p>
    </div>
  );
}
