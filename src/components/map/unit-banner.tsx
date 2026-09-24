import { useTranslations } from "next-intl";
import { LocalizedContent } from "@/components/shared/localized-content";
import { Motif } from "@/components/shared/motif";
import type { MapUnit } from "@/lib/supabase/queries/units";

export function UnitBanner({ unit, number, done }: { unit: MapUnit; number: number; done: number | null }) {
  const t = useTranslations("Map");
  const home = useTranslations("Home");
  const total = unit.levels.length;

  return (
    <div className="sticky top-[4.75rem] z-20 mx-auto max-w-[420px] px-4 pt-5">
      <div className="overflow-hidden rounded-2xl bg-card/90 shadow-raised ring-1 ring-border backdrop-blur-md">
        <Motif variant="band" className="h-2.5" />
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary uppercase ltr:tracking-wider">
              {home("unitNumber", { number })}
            </p>
            <LocalizedContent value={unit.title} as="h2" className="truncate text-lg leading-snug font-semibold" />
            <LocalizedContent value={unit.description} as="p" className="line-clamp-1 text-xs text-muted-foreground" />
          </div>
          {done !== null && (
            <div className="shrink-0 text-center" aria-label={t("unitProgressLabel", { done, total })} role="img">
              <span className="font-heading text-xl font-semibold">{t("unitProgress", { done, total })}</span>
              <div aria-hidden className="mt-1 h-1.5 w-14 overflow-hidden rounded-full bg-muted rtl:-scale-x-100">
                <div className="h-full rounded-full bg-gold" style={{ width: `${(done / Math.max(total, 1)) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
