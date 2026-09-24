import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContributeForm } from "@/components/contribute/contribute-form";
import { Motif } from "@/components/shared/motif";
import { getRegions } from "@/lib/supabase/queries/regions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contribute");
  return { title: t("title"), description: t("lead") };
}

async function loadRegions() {
  try {
    return await getRegions();
  } catch {
    return [];
  }
}

export default async function ContributePage() {
  const t = await getTranslations("Contribute");
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{t("lead")}</p>
      <Motif variant="zigzag" className="my-6 max-w-40" />
      <ContributeForm regions={await loadRegions()} />
    </div>
  );
}
