import { PlusIcon, UploadIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { EntryList } from "@/components/admin/entries/entry-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localize } from "@/i18n/localize";
import { Link } from "@/i18n/navigation";
import { listEntries, PAGE_SIZE } from "@/lib/admin/queries";
import { localizedTextSchema } from "@/lib/content/localized-text";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("entries") };
}

const STATUSES = ["all", "draft", "published"] as const;

export default async function EntriesPage({ searchParams }: PageProps<"/[locale]/admin/entries">) {
  const t = await getTranslations("Admin.entries");
  const locale = await getLocale();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = STATUSES.find((s) => s === params.status) ?? "all";
  const page = Math.max(0, Number(params.page) || 0);
  const { rows, total } = await listEntries({ q, status, page });
  const query = (p: number) => `?${new URLSearchParams({ q, status, page: String(p) })}`;

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("lead", { count: total })}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/entries/import">
                <UploadIcon aria-hidden />
                {t("import")}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/entries/new">
                <PlusIcon aria-hidden />
                {t("new")}
              </Link>
            </Button>
          </>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder={t("search")} aria-label={t("search")} className="max-w-sm" />
        <select name="status" defaultValue={status} aria-label={t("statusFilter")} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`filter.${s}`)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          {t("searchButton")}
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <EntryList
          rows={rows.map((row) => {
            const meaning = localizedTextSchema.safeParse(row.translations);
            const region = row.regions ? localizedTextSchema.safeParse(row.regions.name) : null;
            return {
              id: row.id,
              latin: row.text_latin,
              scripts: [row.text_arabic, row.text_tifinagh].filter(Boolean).join(" · "),
              meaning: meaning.success ? (localize(meaning.data, locale)?.text ?? "") : "",
              region: region?.success ? (localize(region.data, locale)?.text ?? null) : null,
              clips: row.audio_clips.length,
              status: row.status,
            };
          })}
        />
      )}

      {total > PAGE_SIZE && (
        <nav aria-label={t("pagination")} className="mt-4 flex items-center justify-between">
          <Button asChild variant="outline" disabled={page === 0}>
            {page > 0 ? <Link href={`/admin/entries${query(page - 1)}`}>{t("previous")}</Link> : <span>{t("previous")}</span>}
          </Button>
          <span className="text-sm text-muted-foreground">{t("page", { page: page + 1, pages: Math.ceil(total / PAGE_SIZE) })}</span>
          <Button asChild variant="outline" disabled={(page + 1) * PAGE_SIZE >= total}>
            {(page + 1) * PAGE_SIZE < total ? <Link href={`/admin/entries${query(page + 1)}`}>{t("next")}</Link> : <span>{t("next")}</span>}
          </Button>
        </nav>
      )}
    </>
  );
}
