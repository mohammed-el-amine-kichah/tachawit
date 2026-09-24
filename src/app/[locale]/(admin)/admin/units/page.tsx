import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { UnitsList } from "@/components/admin/map/units-list";
import { PageHeader } from "@/components/admin/page-header";
import { listUnits } from "@/lib/admin/queries";
import { parseLocalizedText } from "@/lib/content/localized-text";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("units") };
}

export default async function UnitsPage() {
  const t = await getTranslations("Admin.map");
  const units = (await listUnits()).map((u) => ({
    id: u.id,
    title: parseLocalizedText(u.title),
    status: u.status,
    levels: u.levels.length,
    published: u.levels.filter((l) => l.status === "published").length,
  }));
  return (
    <>
      <PageHeader title={t("unitsTitle")} description={t("unitsLead")} />
      <UnitsList units={units} />
    </>
  );
}
