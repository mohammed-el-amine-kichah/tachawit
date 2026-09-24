import { AudioLinesIcon, BookAIcon, BookOpenIcon, InboxIcon, MicIcon, TrophyIcon, UsersIcon, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { Link } from "@/i18n/navigation";
import { dashboardCounts } from "@/lib/admin/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("dashboard") };
}

function Card({ icon: Icon, value, label, detail, href }: { icon: LucideIcon; value: number; label: string; detail?: string; href?: string }) {
  const body = (
    <>
      <Icon aria-hidden className="size-5 text-primary" />
      <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
      <p className="font-medium">{label}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
    </>
  );
  const className = "block rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border transition-colors";
  return href ? (
    <Link href={href} className={`${className} hover:ring-primary`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default async function AdminDashboard() {
  const t = await getTranslations("Admin.dashboard");
  const c = await dashboardCounts();
  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={BookAIcon} value={c.entries} label={t("entries")} detail={t("published", { count: c.publishedEntries })} href="/admin/entries" />
        <Card icon={AudioLinesIcon} value={c.clips} label={t("clips")} detail={t("published", { count: c.publishedClips })} href="/admin/audio" />
        <Card icon={MicIcon} value={c.speakers} label={t("speakers")} detail={t("withConsent", { count: c.consenting })} href="/admin/speakers" />
        <Card icon={InboxIcon} value={c.pending} label={t("pending")} />
        <Card icon={BookOpenIcon} value={c.lessons + c.quizzes} label={t("lessonsAndQuizzes")} detail={t("units", { count: c.units })} />
        <Card icon={UsersIcon} value={c.learners} label={t("learners")} href="/admin/users" />
        <Card icon={TrophyIcon} value={c.completions} label={t("completions")} />
      </div>
    </>
  );
}
