"use client";

import { CheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { publishWithDependencies } from "@/app/actions/admin/content";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { localize } from "@/i18n/localize";
import { Link } from "@/i18n/navigation";
import { applySelection, isPlanEmpty, readiness, type ReadinessInput } from "@/lib/admin/readiness";
import { localizedTextSchema } from "@/lib/content/localized-text";
import { useAdminAction } from "../use-admin-action";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </section>
  );
}

function Tick({ checked, onChange, children }: { checked: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <li>
      <label className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
        <Checkbox checked={checked} onCheckedChange={(on) => onChange(on === true)} />
        <span className="min-w-0">{children}</span>
      </label>
    </li>
  );
}

function toggled(set: Set<string>, id: string, on: boolean): Set<string> {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

function Body({ kind, contentId, input, onDone }: { kind: "lesson" | "quiz"; contentId: string; input: ReadinessInput; onDone: () => void }) {
  const t = useTranslations("Admin.publish");
  const tm = useTranslations("Admin.map");
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const state = readiness(input);
  const { plan } = state;
  const [clips, setClips] = useState(() => new Set(plan.clipIds));
  const [levels, setLevels] = useState(() => new Set(plan.levelIds));
  const [units, setUnits] = useState(() => new Set(plan.unitIds));

  const textOf = (value: unknown) => {
    const parsed = localizedTextSchema.safeParse(value);
    return parsed.success ? (localize(parsed.data, locale)?.text ?? null) : null;
  };
  const entries = new Map(input.entries.map((e) => [e.id, e]));
  const clipLabel = (clipId: string) => {
    const entry = input.entries.find((e) => e.clips.some((c) => c.id === clipId));
    const clip = entry?.clips.find((c) => c.id === clipId);
    return t("recording", { word: entry?.text ?? "", speaker: clip?.speaker ?? t("unknownSpeaker") });
  };
  const unitOf = new Map(input.levels.map((l) => [l.unit.id, l.unit]));

  const applied = applySelection(plan, { clipIds: [...clips], levelIds: [...levels], unitIds: [...units] });
  const willBeLive = input.levels.some(
    (l) => (l.status === "published" || levels.has(l.id)) && (l.unit.status === "published" || units.has(l.unit.id)),
  );

  const publish = () =>
    run(() => publishWithDependencies(kind, contentId, { clipIds: applied.clipIds, levelIds: applied.levelIds, unitIds: applied.unitIds }), {
      success: t(willBeLive ? "done" : "doneHidden"),
      onSuccess: onDone,
    });

  return (
    <>
      <div className="flex flex-col gap-5">
        {plan.content && (
          <Section title={t(kind === "lesson" ? "thisLesson" : "thisQuiz")}>
            <li className="flex items-center gap-3 px-2 text-sm">
              <CheckIcon aria-hidden className="size-4 text-success" />
              {t("contentItem")}
            </li>
          </Section>
        )}

        {plan.entryIds.length > 0 && (
          <Section title={t("words")} hint={t("wordsHint")}>
            {plan.entryIds.map((entryId) => (
              <li key={entryId} className="flex items-center gap-3 px-2 text-sm">
                <CheckIcon aria-hidden className="size-4 text-success" />
                <span dir="ltr" lang="shy-Latn" className="font-medium">
                  {entries.get(entryId)?.text}
                </span>
              </li>
            ))}
          </Section>
        )}

        {plan.clipIds.length > 0 && (
          <Section title={t("recordings")} hint={t("recordingsHint")}>
            {plan.clipIds.map((clipId) => (
              <Tick key={clipId} checked={clips.has(clipId)} onChange={(on) => setClips(toggled(clips, clipId, on))}>
                {clipLabel(clipId)}
              </Tick>
            ))}
          </Section>
        )}

        {(plan.levelIds.length > 0 || plan.unitIds.length > 0) && (
          <Section title={t("map")} hint={plan.unitIds.length ? t("unitHint") : undefined}>
            {plan.levelIds.map((levelId) => {
              const level = input.levels.find((l) => l.id === levelId)!;
              return (
                <Tick key={levelId} checked={levels.has(levelId)} onChange={(on) => setLevels(toggled(levels, levelId, on))}>
                  {t("level", { unit: textOf(level.unit.title) ?? "", level: textOf(level.title) ?? tm("levelNumber", { number: level.position + 1 }) })}
                </Tick>
              );
            })}
            {plan.unitIds.map((unitId) => (
              <Tick key={unitId} checked={units.has(unitId)} onChange={(on) => setUnits(toggled(units, unitId, on))}>
                {t("unit", { unit: textOf(unitOf.get(unitId)?.title) ?? "" })}
              </Tick>
            ))}
          </Section>
        )}

        {state.silentEntryIds.length > 0 && (
          <div className="flex gap-2 rounded-lg bg-gold/15 px-3 py-2 text-sm">
            <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <div>
              <p>{t("silent")}</p>
              <p className="flex flex-wrap gap-x-3">
                {state.silentEntryIds.map((entryId) => (
                  <Link key={entryId} href={`/admin/entries/${entryId}`} className="font-medium underline underline-offset-2" dir="ltr">
                    {entries.get(entryId)?.text}
                  </Link>
                ))}
              </p>
              {state.noConsentClipIds.length > 0 && <p className="mt-1 text-muted-foreground">{t("noConsent")}</p>}
            </div>
          </div>
        )}

        {!state.onMap && (
          <div className="flex gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <p>
              {t("notOnMapHint")}{" "}
              <Link href="/admin/units" className="font-medium underline underline-offset-2">
                {t("openMap")}
              </Link>
            </p>
          </div>
        )}

        <p className="text-sm text-muted-foreground">{t(willBeLive ? "willBeLive" : "stillHidden")}</p>
      </div>

      <DialogFooter>
        <Button type="button" onClick={publish} disabled={pending || isPlanEmpty(applied)} className="bg-success text-success-foreground hover:bg-success/90">
          {t("confirm")}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Publishes a lesson or quiz and everything learners need to reach it, after showing exactly what that is. */
export function PublishChecklist({
  kind,
  contentId,
  input,
  open,
  onOpenChange,
}: {
  kind: "lesson" | "quiz";
  contentId: string;
  input: ReadinessInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Admin.publish");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(input?.status === "published" ? "titleVisible" : "title")}</DialogTitle>
          <DialogDescription>{t("lead")}</DialogDescription>
        </DialogHeader>
        {input && <Body key={JSON.stringify(input)} kind={kind} contentId={contentId} input={input} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
