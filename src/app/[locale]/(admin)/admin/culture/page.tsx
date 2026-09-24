import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { NewCultureButton } from "@/components/admin/culture/new-culture-button";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { localize } from "@/i18n/localize";
import { Link } from "@/i18n/navigation";
import { listCultureAdmin } from "@/lib/admin/queries";
import { localizedTextSchema } from "@/lib/content/localized-text";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("culture") };
}

export default async function AdminCulturePage() {
  const t = await getTranslations("Admin.culture");
  const cats = await getTranslations("Culture.categories");
  const locale = await getLocale();
  const notes = await listCultureAdmin();
  return (
    <>
      <PageHeader title={t("listTitle")} description={t("listLead")} actions={<NewCultureButton />} />
      <ul className="divide-y rounded-xl bg-card ring-1 ring-border">
        {notes.map((n) => {
          const title = localizedTextSchema.safeParse(n.title);
          return (
            <li key={n.id}>
              <Link href={`/admin/culture/${n.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50">
                <span className="min-w-0 flex-1 font-medium">{title.success ? localize(title.data, locale)?.text : n.slug}</span>
                <span className="text-sm text-muted-foreground">{cats(n.category)}</span>
                <StatusBadge status={n.status} />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
