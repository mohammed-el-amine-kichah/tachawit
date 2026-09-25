import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { UnitEditor } from "@/components/admin/map/unit-editor";
import { UnitForm } from "@/components/admin/map/unit-form";
import { PageHeader } from "@/components/admin/page-header";
import { localize } from "@/i18n/localize";
import { getUnitEditor } from "@/lib/admin/queries";
import { localizedTextSchema, parseLocalizedText } from "@/lib/content/localized-text";
import { defaultUnlockRule, unlockRuleSchema } from "@/lib/content/unlock-rule";

const optionalText = (value: unknown) => {
  const parsed = localizedTextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

export default async function UnitPage({ params, searchParams }: PageProps<"/[locale]/admin/units/[unitId]">) {
  const { unitId } = await params;
  const { level: levelParam } = await searchParams;
  if (!z.uuid().safeParse(unitId).success) notFound();
  const t = await getTranslations("Admin.map");
  const nav = await getTranslations("Admin.nav");
  const locale = await getLocale();
  const data = await getUnitEditor(unitId);
  if (!data) notFound();
  const title = parseLocalizedText(data.unit.title);

  return (
    <>
      <PageHeader title={localize(title, locale)?.text ?? data.unit.slug} description={t("unitLead")} back={{ href: "/admin/units", label: nav("units") }} />
      <div className="flex flex-col gap-10">
        <UnitEditor
          unitId={data.unit.id}
          theme={data.unit.map_theme}
          unitStatus={data.unit.status}
          initialLevelId={data.levels.find((l) => l.id === levelParam)?.id ?? data.levels[0]?.id ?? null}
          levels={data.levels.map((l) => {
            const rule = unlockRuleSchema.safeParse(l.unlock_rule);
            return {
              id: l.id,
              type: l.type,
              title: optionalText(l.title),
              lesson_id: l.lesson_id,
              quiz_id: l.quiz_id,
              unlockRule: rule.success ? rule.data : defaultUnlockRule,
              x: l.map_x,
              y: l.map_y,
              status: l.status,
            };
          })}
          lessons={data.lessons.map((o) => ({ id: o.id, status: o.status, title: parseLocalizedText(o.title) }))}
          quizzes={data.quizzes.map((o) => ({ id: o.id, status: o.status, title: parseLocalizedText(o.title) }))}
          units={data.units.map((u) => ({ id: u.id, title: parseLocalizedText(u.title) }))}
        />
        <section aria-labelledby="unit-settings" className="max-w-3xl">
          <h2 id="unit-settings" className="mb-4 font-sans text-lg font-semibold">
            {t("unitSettings")}
          </h2>
          <UnitForm
            key={JSON.stringify(data.unit)}
            unit={{ ...data.unit, title, description: optionalText(data.unit.description) }}
          />
        </section>
      </div>
    </>
  );
}
