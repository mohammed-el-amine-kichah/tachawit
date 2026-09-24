import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { SubmissionCard } from "@/components/admin/submissions/submission-card";
import { Link } from "@/i18n/navigation";
import { listRegions, listSubmissions } from "@/lib/admin/queries";
import { localizedTextSchema, parseLocalizedText } from "@/lib/content/localized-text";
import { cn } from "@/lib/utils";

// Approving a recording converts its audio.
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("submissions") };
}

const STATUSES = ["pending", "approved", "rejected"] as const;

export default async function SubmissionsPage({ searchParams }: PageProps<"/[locale]/admin/submissions">) {
  const t = await getTranslations("Admin.submissions");
  const { status: raw } = await searchParams;
  const status = STATUSES.find((s) => s === raw) ?? "pending";
  const [submissions, regions] = await Promise.all([listSubmissions(status), listRegions()]);
  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} />
      <nav aria-label={t("filter")} className="mb-4 flex gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/submissions?status=${s}`}
            aria-current={s === status ? "page" : undefined}
            className={cn("rounded-full px-3 py-1.5 text-sm ring-1 ring-border", s === status ? "bg-primary text-primary-foreground ring-primary" : "hover:bg-muted")}
          >
            {t(`statuses.${s}`)}
          </Link>
        ))}
      </nav>
      {submissions.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {submissions.map((s) => {
            const translations = localizedTextSchema.safeParse(s.translations);
            return (
              <SubmissionCard
                key={s.id}
                submission={{ ...s, translations: translations.success ? translations.data : null }}
                regions={regions.map((r) => ({ id: r.id, name: parseLocalizedText(r.name) }))}
              />
            );
          })}
        </ul>
      )}
    </>
  );
}
