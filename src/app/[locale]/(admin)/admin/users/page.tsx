import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { UserRoleSwitch } from "@/components/admin/user-role-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/admin/guard";
import { listUsers } from "@/lib/admin/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("users") };
}

export default async function UsersPage({ searchParams }: PageProps<"/[locale]/admin/users">) {
  const t = await getTranslations("Admin.users");
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const [{ userId }, users] = await Promise.all([requireAdmin(), listUsers(query)]);
  return (
    <>
      <PageHeader title={t("title")} description={t("lead")} />
      <form method="get" className="mb-4 flex gap-2">
        <Input name="q" defaultValue={query} placeholder={t("search")} aria-label={t("search")} className="max-w-sm" />
        <Button type="submit" variant="secondary">
          {t("searchButton")}
        </Button>
      </form>
      <ul className="divide-y rounded-xl bg-card ring-1 ring-border">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0">
              <span className="block font-medium">{u.display_name ?? t("noName")}</span>
              <span className="block truncate text-sm text-muted-foreground" dir="ltr">
                {u.email}
              </span>
            </span>
            <UserRoleSwitch id={u.id} admin={u.role === "admin"} self={u.id === userId} />
          </li>
        ))}
      </ul>
    </>
  );
}
