import { useTranslations } from "next-intl";
import { LocalizedContent } from "@/components/shared/localized-content";
import { Motif } from "@/components/shared/motif";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { UnitSummary } from "@/lib/supabase/queries/units";

/** Unit overview shown on the home page until the illustrated map replaces it. */
export function UnitCard({ unit, number }: { unit: UnitSummary; number: number }) {
  const t = useTranslations("Home");
  const levelType = useTranslations("LevelType");

  return (
    <Card className="h-full gap-5 pt-0 shadow-soft ring-border">
      <Motif variant="band" className="h-3" />
      <CardHeader className="gap-2">
        <p className="text-xs font-semibold text-primary uppercase ltr:tracking-wider">{t("unitNumber", { number })}</p>
        <LocalizedContent value={unit.title} as="h3" className="text-2xl leading-tight font-semibold" />
        <LocalizedContent value={unit.description} as="p" className="text-sm text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {unit.levels.map((level, index) => (
            <li key={level.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-foreground"
              >
                {index + 1}
              </span>
              <span className="flex flex-col">
                <LocalizedContent value={level.title} className="font-medium" />
                <span className="text-xs text-muted-foreground">{levelType(level.type)}</span>
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 py-3 text-muted-foreground">
        {t("levelCount", { count: unit.levels.length })}
      </CardFooter>
    </Card>
  );
}
