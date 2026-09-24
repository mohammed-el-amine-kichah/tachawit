import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/admin/page-header";
import { SpeakerForm } from "@/components/admin/speakers/speaker-form";
import { listRegions, listSpeakers } from "@/lib/admin/queries";
import { localizedTextSchema, parseLocalizedText } from "@/lib/content/localized-text";

export default async function EditSpeakerPage({ params }: PageProps<"/[locale]/admin/speakers/[speakerId]">) {
  const { speakerId } = await params;
  if (!z.uuid().safeParse(speakerId).success) notFound();
  const [speakers, regions] = await Promise.all([listSpeakers(), listRegions()]);
  const speaker = speakers.find((s) => s.id === speakerId);
  if (!speaker) notFound();
  const bio = localizedTextSchema.safeParse(speaker.public_bio);
  return (
    <>
      <PageHeader title={speaker.display_name} />
      <SpeakerForm
        key={speaker.id}
        speaker={{ ...speaker, public_bio: bio.success ? bio.data : null }}
        regions={regions.map((r) => ({ ...r, name: parseLocalizedText(r.name) }))}
      />
    </>
  );
}
