import { getTranslations } from "next-intl/server";
import { CsvImport } from "@/components/admin/entries/csv-import";
import { PageHeader } from "@/components/admin/page-header";
import { listRegions } from "@/lib/admin/queries";

export default async function ImportPage() {
  const t = await getTranslations("Admin.import");
  const nav = await getTranslations("Admin.nav");
  const regions = await listRegions();
  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} back={{ href: "/admin/entries", label: nav("entries") }} />
      <CsvImport regionsBySlug={Object.fromEntries(regions.map((r) => [r.slug, r.id]))} />
    </>
  );
}
