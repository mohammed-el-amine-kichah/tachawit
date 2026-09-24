import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentListPage } from "@/components/admin/builder/content-pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("lessons") };
}

export default function Page() {
  return <ContentListPage kind="lesson" />;
}
