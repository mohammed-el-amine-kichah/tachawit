import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResourceCard } from "@/components/resources/resource-card";
import { Entrance } from "@/components/shared/entrance";
import { Notice } from "@/components/shared/notice";
import { getResources, type Resource } from "@/lib/supabase/queries/resources";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Resources");
  return { title: t("title"), description: t("lead") };
}

async function load(): Promise<Resource[] | null> {
  try {
    return await getResources();
  } catch (error) {
    console.error("Could not load resources", error);
    return null;
  }
}

export default async function ResourcesPage() {
  const t = await getTranslations("Resources");
  const resources = await load();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{t("lead")}</p>
      <div className="mt-8">
        {resources === null ? (
          <Notice>{t("unavailable")}</Notice>
        ) : resources.length === 0 ? (
          <Notice>{t("empty")}</Notice>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource, index) => (
              <Entrance as="li" key={resource.id} index={index}>
                <ResourceCard resource={resource} />
              </Entrance>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
