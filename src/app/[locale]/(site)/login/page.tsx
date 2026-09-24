import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { Motif } from "@/components/shared/motif";
import { ZMark } from "@/components/shared/z-mark";
import { getPathname } from "@/i18n/navigation";
import { safeNextPath } from "@/lib/site-url";
import { createServerSupabase } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: t("title") };
}

export default async function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  const locale = await getLocale();
  const t = await getTranslations("Auth");
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? safeNextPath(next, "") || null : null;

  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims.sub) redirect(nextPath ?? getPathname({ href: "/profile", locale }));

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
      <div className="overflow-hidden rounded-3xl bg-card shadow-raised ring-1 ring-border">
        <Motif variant="band" className="h-3" />
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <ZMark className="size-10 text-primary" />
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("lead")}</p>
          </div>
          <LoginForm next={nextPath} error={typeof error === "string" ? error : null} />
        </div>
      </div>
    </div>
  );
}
