"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Brand } from "@/components/shared/brand";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { adminNav } from "./nav-items";

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar on wide screens, a scrollable tab strip on phones. */
export function AdminSidebar({ pendingSubmissions }: { pendingSubmissions: number }) {
  const t = useTranslations("Admin.nav");
  const pathname = usePathname();

  return (
    <aside className="border-b bg-card md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:border-e md:border-b-0">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <Brand />
        <div className="flex items-center md:hidden">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <nav aria-label={t("label")} className="overflow-x-auto md:flex-1 md:overflow-y-auto">
        <ul className="flex gap-1 px-2 pb-2 md:flex-col md:px-3">
          {adminNav.map(({ section, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={section}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                  {t(section)}
                  {section === "submissions" && pendingSubmissions > 0 && (
                    <span className="ms-auto rounded-full bg-gold px-2 text-xs text-gold-foreground">{pendingSubmissions}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="hidden items-center justify-between gap-2 border-t px-3 py-3 md:flex">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon aria-hidden className="size-4 rtl:-scale-x-100" />
          {t("backToSite")}
        </Link>
        <div className="flex">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
