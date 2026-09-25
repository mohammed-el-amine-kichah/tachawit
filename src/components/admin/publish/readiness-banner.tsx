"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isPlanEmpty, type Readiness } from "@/lib/admin/readiness";

/** One line saying whether learners can see this, and if not, everything that still hides it. */
export function ReadinessBanner({ state, onReview }: { state: Readiness; onReview: () => void }) {
  const t = useTranslations("Admin.publish");

  if (state.live) {
    return (
      <p className="flex flex-wrap items-center gap-2 rounded-xl bg-success/10 px-4 py-2 text-sm">
        <EyeIcon aria-hidden className="size-4 text-success" />
        {t("live")}
        {state.silentEntryIds.length > 0 && <span className="text-muted-foreground">· {t("notHeard", { count: state.silentEntryIds.length })}</span>}
      </p>
    );
  }

  const { plan } = state;
  const reasons = [
    state.empty && t("empty"),
    state.incomplete > 0 && t("incomplete", { count: state.incomplete }),
    state.missingEntryIds.length > 0 && t("missing", { count: state.missingEntryIds.length }),
    plan.content && t("contentDraft"),
    plan.entryIds.length > 0 && t("entriesDraft", { count: plan.entryIds.length }),
    plan.clipIds.length + state.silentEntryIds.length > 0 && t("notHeard", { count: plan.clipIds.length + state.silentEntryIds.length }),
    !state.onMap && t("notOnMap"),
    plan.levelIds.length > 0 && t("levelsDraft", { count: plan.levelIds.length }),
    plan.unitIds.length > 0 && t("unitsDraft", { count: plan.unitIds.length }),
  ].filter((reason): reason is string => typeof reason === "string");

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-gold/15 px-4 py-2 text-sm">
      <EyeOffIcon aria-hidden className="size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        <span className="font-medium">{t("hidden")}</span> {reasons.join(" · ")}
      </p>
      {!state.onMap && (
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/units">{t("openMap")}</Link>
        </Button>
      )}
      {!plan.content && state.canPublish && !isPlanEmpty(plan) && (
        <Button type="button" size="sm" onClick={onReview}>
          {t("review")}
        </Button>
      )}
    </div>
  );
}
