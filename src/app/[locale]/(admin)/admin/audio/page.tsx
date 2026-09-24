import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AudioLibrary } from "@/components/admin/audio/audio-library";
import { PageHeader } from "@/components/admin/page-header";
import { Link } from "@/i18n/navigation";
import { listClips } from "@/lib/admin/queries";
import { speakerOptions } from "@/lib/admin/speaker-options";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("audio") };
}

const FILTERS = ["all", "unlinked", "draft"] as const;

export default async function AudioPage({ searchParams }: PageProps<"/[locale]/admin/audio">) {
  const t = await getTranslations("Admin.audio");
  const { filter: raw } = await searchParams;
  const filter = FILTERS.find((f) => f === raw) ?? "all";
  const [clips, speakers] = await Promise.all([listClips(filter), speakerOptions()]);
  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} />
      <nav aria-label={t("filterLabel")} className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/audio?filter=${f}`}
            aria-current={f === filter ? "page" : undefined}
            className={cn("rounded-full px-3 py-1.5 text-sm ring-1 ring-border", f === filter ? "bg-primary text-primary-foreground ring-primary" : "hover:bg-muted")}
          >
            {t(`filters.${f}`)}
          </Link>
        ))}
      </nav>
      <AudioLibrary clips={clips} speakers={speakers} />
    </>
  );
}
