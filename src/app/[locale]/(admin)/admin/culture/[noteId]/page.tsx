import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { CultureEditor } from "@/components/admin/culture/culture-editor";
import { PageHeader } from "@/components/admin/page-header";
import { localize } from "@/i18n/localize";
import { getCultureAdmin } from "@/lib/admin/queries";
import { localizedTextSchema, parseLocalizedText } from "@/lib/content/localized-text";

export default async function EditCulturePage({ params }: PageProps<"/[locale]/admin/culture/[noteId]">) {
  const { noteId } = await params;
  if (!z.uuid().safeParse(noteId).success) notFound();
  const locale = await getLocale();
  const data = await getCultureAdmin(noteId);
  if (!data) notFound();
  const { note } = data;
  const title = parseLocalizedText(note.title);
  const summary = localizedTextSchema.safeParse(note.summary);
  const body = z.partialRecord(z.enum(["en", "fr", "ar", "dz"]), z.string()).catch({}).parse(note.body);
  return (
    <>
      <PageHeader title={localize(title, locale)?.text ?? note.slug} />
      <CultureEditor
        key={JSON.stringify(note)}
        note={{ ...note, title, summary: summary.success ? summary.data : null, body }}
        units={data.units.map((u) => ({ id: u.id, title: parseLocalizedText(u.title) }))}
      />
    </>
  );
}
