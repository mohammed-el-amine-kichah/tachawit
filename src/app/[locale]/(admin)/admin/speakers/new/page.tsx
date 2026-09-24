import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { SpeakerForm } from "@/components/admin/speakers/speaker-form";
import { listRegions } from "@/lib/admin/queries";
import { parseLocalizedText } from "@/lib/content/localized-text";

export default async function NewSpeakerPage() {
  const t = await getTranslations("Admin.speakers");
  const regions = (await listRegions()).map((r) => ({ ...r, name: parseLocalizedText(r.name) }));
  return (
    <>
      <PageHeader title={t("new")} />
      <SpeakerForm speaker={null} regions={regions} />
    </>
  );
}
