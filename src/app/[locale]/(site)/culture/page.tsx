import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CultureCard } from "@/components/culture/culture-card";
import { Entrance } from "@/components/shared/entrance";
import { Notice } from "@/components/shared/notice";
import { getCultureList, type CultureCard as Card } from "@/lib/supabase/queries/culture";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Culture");
  return { title: t("title"), description: t("lead") };
}

async function load(): Promise<Card[] | null> {
  try {
    return await getCultureList();
  } catch (error) {
    console.error("Could not load culture articles", error);
    return null;
  }
}

export default async function CulturePage() {
  const t = await getTranslations("Culture");
  const notes = await load();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{t("lead")}</p>
      <div className="mt-8">
        {notes === null ? (
          <Notice>{t("unavailable")}</Notice>
        ) : notes.length === 0 ? (
          <Notice>{t("empty")}</Notice>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note, index) => (
              <Entrance as="li" key={note.id} index={index}>
                <CultureCard note={note} />
              </Entrance>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
