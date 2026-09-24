import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DesignSection } from "@/components/design/design-section";
import { Entrance } from "@/components/shared/entrance";
import { Swatch } from "@/components/design/swatch";
import { LocalizedContent } from "@/components/shared/localized-content";
import { Motif } from "@/components/shared/motif";
import { Notice } from "@/components/shared/notice";
import { ScriptToggle } from "@/components/shared/script-toggle";
import { TachawitText } from "@/components/shared/tachawit-text";
import { ZMark } from "@/components/shared/z-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getPublishedEntries, type EntrySummary } from "@/lib/supabase/queries/entries";

const semanticSwatches = [
  { key: "background", token: "--background", className: "bg-background" },
  { key: "card", token: "--card", className: "bg-card" },
  { key: "primary", token: "--primary", className: "bg-primary" },
  { key: "secondary", token: "--secondary", className: "bg-secondary" },
  { key: "accent", token: "--accent", className: "bg-accent" },
  { key: "success", token: "--success", className: "bg-success" },
  { key: "gold", token: "--gold", className: "bg-gold" },
  { key: "muted", token: "--muted", className: "bg-muted" },
] as const;

const paletteSwatches = [
  { key: "terracotta", token: "--terracotta-500", className: "bg-terracotta" },
  { key: "ochre", token: "--ochre-400", className: "bg-ochre" },
  { key: "indigo", token: "--indigo-600", className: "bg-indigo" },
  { key: "cedar", token: "--cedar-500", className: "bg-cedar" },
  { key: "silver", token: "--silver-300", className: "bg-silver-swatch" },
  { key: "sand", token: "--sand-100", className: "bg-sand" },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Design");
  return { title: t("metaTitle"), robots: { index: false } };
}

async function loadEntries(): Promise<EntrySummary[] | null> {
  try {
    return await getPublishedEntries();
  } catch (error) {
    console.error("Could not load published entries", error);
    return null;
  }
}

export default async function DesignPage() {
  const t = await getTranslations("Design");
  const entries = await loadEntries();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t("lead")}</p>

      <DesignSection id="colors" title={t("colorsTitle")}>
        <h3 className="mb-4 font-sans text-sm font-semibold text-muted-foreground">{t("semanticTitle")}</h3>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {semanticSwatches.map((s) => (
            <Swatch key={s.key} label={t(`swatch.${s.key}`)} token={s.token} className={s.className} />
          ))}
        </ul>
        <h3 className="mt-8 mb-4 font-sans text-sm font-semibold text-muted-foreground">{t("paletteTitle")}</h3>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {paletteSwatches.map((s) => (
            <Swatch key={s.key} label={t(`swatch.${s.key}`)} token={s.token} className={s.className} />
          ))}
        </ul>
      </DesignSection>

      <DesignSection id="type" title={t("typeTitle")}>
        <div className="space-y-8">
          <div>
            <p className="text-sm text-muted-foreground">{t("typeDisplay")}</p>
            <p className="mt-1 font-heading text-4xl font-semibold sm:text-5xl">{t("title")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("typeBody")}</p>
            <p className="mt-1 max-w-2xl text-lg">{t("bodySample")}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">{t("typeTamazight")}</p>
              <p className="mt-1 text-2xl leading-relaxed" dir="ltr">
                {t("glyphsLatin")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("typeArabic")}</p>
              <p className="mt-1 font-arabic text-2xl leading-relaxed" dir="rtl" lang="ar">
                {t("glyphsArabic")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("typeTifinagh")}</p>
              <p className="mt-1 font-tifinagh text-2xl leading-relaxed" dir="ltr" lang="shy-Tfng">
                {t("glyphsTifinagh")}
              </p>
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection id="components" title={t("componentsTitle")}>
        <div className="flex flex-wrap gap-3">
          <Button size="lg">{t("buttonPrimary")}</Button>
          <Button size="lg" variant="secondary">
            {t("buttonSecondary")}
          </Button>
          <Button size="lg" variant="outline">
            {t("buttonOutline")}
          </Button>
          <Button size="lg" variant="ghost">
            {t("buttonGhost")}
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge>{t("badgeNew")}</Badge>
          <Badge variant="secondary">{t("badgeDone")}</Badge>
          <Badge variant="outline">{t("badgeNew")}</Badge>
        </div>
        <div className="mt-6 max-w-sm">
          <p className="mb-2 text-sm text-muted-foreground">{t("progressLabel")}</p>
          <Progress value={60} aria-label={t("progressLabel")} className="h-3" />
        </div>
        <div className="mt-6">
          <ScriptToggle />
        </div>
        <Card className="mt-6 max-w-sm pt-0 shadow-soft">
          <Motif variant="band" className="h-3" />
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("cardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">{t("cardBody")}</CardContent>
        </Card>
      </DesignSection>

      <DesignSection id="motifs" title={t("motifsTitle")} lead={t("motifsLead")}>
        <div className="grid gap-6 sm:grid-cols-2">
          <figure>
            <Motif variant="band" />
            <figcaption className="mt-2 text-sm text-muted-foreground">{t("motifBand")}</figcaption>
          </figure>
          <figure>
            <Motif variant="zigzag" />
            <figcaption className="mt-2 text-sm text-muted-foreground">{t("motifZigzag")}</figcaption>
          </figure>
          <figure>
            <div className="relative h-28 overflow-hidden rounded-xl bg-card ring-1 ring-border">
              <Motif variant="weave" className="absolute inset-0 h-full opacity-25" />
            </div>
            <figcaption className="mt-2 text-sm text-muted-foreground">{t("motifWeave")}</figcaption>
          </figure>
          <figure>
            <div className="flex h-28 items-end gap-4 text-primary">
              <ZMark className="size-6" />
              <ZMark className="size-10" />
              <ZMark className="size-16 text-secondary" />
              <ZMark className="size-24 text-gold" />
            </div>
            <figcaption className="mt-2 text-sm text-muted-foreground">{t("motifMark")}</figcaption>
          </figure>
        </div>
      </DesignSection>

      <DesignSection id="tachawit" title={t("tachawitTitle")} lead={t("tachawitLead")}>
        {entries === null ? (
          <Notice>{t("tachawitUnavailable")}</Notice>
        ) : entries.length === 0 ? (
          <Notice>{t("tachawitEmpty")}</Notice>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {entries.map((entry, index) => (
              <Entrance as="li" key={entry.id} index={index}>
                <Card size="sm" className="h-full shadow-soft ring-border">
                  <CardContent className="flex flex-col items-start gap-1">
                    <TachawitText entry={entry} as="strong" className="text-2xl font-semibold" />
                    <LocalizedContent value={entry.translations} className="text-sm text-muted-foreground" />
                  </CardContent>
                </Card>
              </Entrance>
            ))}
          </ul>
        )}
      </DesignSection>
    </div>
  );
}
