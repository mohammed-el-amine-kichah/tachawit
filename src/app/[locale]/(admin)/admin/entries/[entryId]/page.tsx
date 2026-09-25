import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { EntryClips } from "@/components/admin/entries/entry-clips";
import { EntryEditor } from "@/components/admin/entries/entry-editor";
import { PageHeader } from "@/components/admin/page-header";
import { getEntryForEditing, listRegions } from "@/lib/admin/queries";
import { ownVoice } from "@/lib/admin/own-voice";
import { localizedTextSchema, parseLocalizedText } from "@/lib/content/localized-text";

export default async function EditEntryPage({ params }: PageProps<"/[locale]/admin/entries/[entryId]">) {
  const { entryId } = await params;
  if (!z.uuid().safeParse(entryId).success) notFound();
  const t = await getTranslations("Admin.entries");
  const nav = await getTranslations("Admin.nav");
  const [data, regions, voice] = await Promise.all([getEntryForEditing(entryId), listRegions(), ownVoice()]);
  if (!data) notFound();
  const translations = localizedTextSchema.safeParse(data.entry.translations);

  return (
    <>
      <PageHeader title={data.entry.text_latin} description={t("editLead")} back={{ href: "/admin/entries", label: nav("entries") }} />
      <div className="flex flex-col gap-10">
        <EntryEditor
          key={data.entry.id}
          entry={{ ...data.entry, translations: translations.success ? translations.data : {} }}
          clips={data.clips}
          regions={regions.map((r) => ({ ...r, name: parseLocalizedText(r.name) }))}
        />
        <EntryClips entryId={data.entry.id} entryText={data.entry.text_latin} clips={data.clips} voice={voice} />
      </div>
    </>
  );
}
