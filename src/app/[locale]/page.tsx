import { ArrowDownIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { UnitCard } from "@/components/map/unit-card";
import { AnimatedZMark } from "@/components/shared/animated-z-mark";
import { AuresRidges } from "@/components/shared/aures-ridges";
import { Entrance } from "@/components/shared/entrance";
import { Motif } from "@/components/shared/motif";
import { Notice } from "@/components/shared/notice";
import { Button } from "@/components/ui/button";
import { getPublishedUnits, type UnitSummary } from "@/lib/supabase/queries/units";

async function loadUnits(): Promise<UnitSummary[] | null> {
  try {
    return await getPublishedUnits();
  } catch (error) {
    console.error("Could not load published units", error);
    return null;
  }
}

export default async function HomePage() {
  const t = await getTranslations("Home");
  const units = await loadUnits();

  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-b from-(--sky-top) to-(--sky-bottom)">
        <Motif variant="weave" className="absolute inset-0 h-full" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pt-12 text-center sm:pt-20">
          <AnimatedZMark className="size-16 text-primary sm:size-20" />
          <Entrance index={1}>
            <p className="mt-6 text-sm font-medium text-muted-foreground">{t("eyebrow")}</p>
          </Entrance>
          <Entrance index={2}>
            <h1 className="mt-3 text-4xl leading-tight font-semibold sm:text-6xl">{t("title")}</h1>
          </Entrance>
          <Entrance index={3}>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{t("lead")}</p>
          </Entrance>
          <Entrance index={4}>
            <Button asChild size="lg" className="mt-8 h-12 rounded-full px-6 text-base shadow-raised">
              <a href="#journey">
                {t("start")}
                <ArrowDownIcon aria-hidden />
              </a>
            </Button>
          </Entrance>
        </div>
        <AuresRidges className="relative mt-10" />
      </section>

      <section id="journey" aria-labelledby="journey-title" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-6">
        <h2 id="journey-title" className="text-3xl font-semibold">
          {t("journeyTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("journeyLead")}</p>
        <div className="mt-8">
          {units === null ? (
            <Notice>{t("unavailable")}</Notice>
          ) : units.length === 0 ? (
            <Notice>{t("empty")}</Notice>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {units.map((unit, index) => (
                <Entrance as="li" key={unit.id} index={index}>
                  <UnitCard unit={unit} number={index + 1} />
                </Entrance>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
