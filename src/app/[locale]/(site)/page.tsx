import { ArrowDownIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AuresMap } from "@/components/map/aures-map";
import { themeTint } from "@/components/map/scenery";
import { AnimatedZMark } from "@/components/shared/animated-z-mark";
import { AuresRidges } from "@/components/shared/aures-ridges";
import { Entrance } from "@/components/shared/entrance";
import { KeepOffline } from "@/components/shared/keep-offline";
import { Motif } from "@/components/shared/motif";
import { Notice } from "@/components/shared/notice";
import { ZMark } from "@/components/shared/z-mark";
import { Button } from "@/components/ui/button";
import { getMapUnits, type MapUnit } from "@/lib/supabase/queries/units";

async function loadUnits(): Promise<MapUnit[] | null> {
  try {
    return await getMapUnits();
  } catch (error) {
    console.error("Could not load the map", error);
    return null;
  }
}

export default async function HomePage() {
  const t = await getTranslations("Home");
  const map = await getTranslations("Map");
  const units = await loadUnits();
  const firstTheme = units?.[0]?.mapTheme;

  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-b from-(--sky-top) to-(--sky-bottom)">
        <Motif variant="weave" className="absolute inset-0 h-full" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pt-10 text-center sm:pt-16">
          <AnimatedZMark className="size-14 text-primary sm:size-20" />
          <Entrance index={1}>
            <p className="mt-5 text-sm font-medium text-muted-foreground">{t("eyebrow")}</p>
          </Entrance>
          <Entrance index={2}>
            <h1 className="mt-2 text-4xl leading-tight font-semibold sm:text-6xl">{t("title")}</h1>
          </Entrance>
          <Entrance index={3}>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">{t("lead")}</p>
          </Entrance>
          <Entrance index={4}>
            <Button asChild size="lg" className="mt-6 h-12 rounded-full px-6 text-base shadow-raised">
              <a href="#journey">
                {t("start")}
                <ArrowDownIcon aria-hidden />
              </a>
            </Button>
          </Entrance>
        </div>
        <AuresRidges className="relative mt-8" ground={firstTheme ? themeTint[firstTheme] : undefined} />
      </section>

      <section id="journey" aria-labelledby="journey-title" className="scroll-mt-16">
        <h2 id="journey-title" className="sr-only">
          {t("journeyTitle")}
        </h2>
        {units === null ? (
          <Notice className="mx-4 my-10">{t("unavailable")}</Notice>
        ) : units.length === 0 ? (
          <Notice className="mx-4 my-10">{t("empty")}</Notice>
        ) : (
          <>
            <KeepOffline />
            <AuresMap units={units} />
            <div className="flex flex-col items-center gap-3 pt-10 text-center text-sm text-muted-foreground">
              <ZMark className="size-8 text-primary" />
              <p>{map("end")}</p>
            </div>
          </>
        )}
      </section>
    </>
  );
}
