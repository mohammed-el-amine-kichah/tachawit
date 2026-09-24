import { getTranslations } from "next-intl/server";
import { EntryEditor } from "@/components/admin/entries/entry-editor";
import { PageHeader } from "@/components/admin/page-header";
import { listRegions } from "@/lib/admin/queries";
import { parseLocalizedText } from "@/lib/content/localized-text";

export default async function NewEntryPage() {
  const t = await getTranslations("Admin.entries");
  const regions = (await listRegions()).map((r) => ({ ...r, name: parseLocalizedText(r.name) }));
  return (
    <>
      <PageHeader title={t("new")} description={t("newLead")} />
      <EntryEditor entry={null} clips={[]} regions={regions} />
    </>
  );
}
