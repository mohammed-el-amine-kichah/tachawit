import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { RegionsManager } from "@/components/admin/regions-manager";
import { listRegions } from "@/lib/admin/queries";
import { parseLocalizedText } from "@/lib/content/localized-text";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("regions") };
}

export default async function RegionsPage() {
  const t = await getTranslations("Admin.regions");
  const regions = (await listRegions()).map((r) => ({ ...r, name: parseLocalizedText(r.name) }));
  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} />
      <RegionsManager regions={regions} />
    </>
  );
}
