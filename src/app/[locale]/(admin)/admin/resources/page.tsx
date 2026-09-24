import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { ResourcesManager } from "@/components/admin/resources-manager";
import { listResourcesAdmin } from "@/lib/admin/queries";
import { parseLocalizedText } from "@/lib/content/localized-text";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("resources") };
}

export default async function AdminResourcesPage() {
  const t = await getTranslations("Admin.resources");
  const resources = (await listResourcesAdmin()).map((r) => ({ ...r, summary: parseLocalizedText(r.summary) }));
  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} />
      <ResourcesManager resources={resources} />
    </>
  );
}
