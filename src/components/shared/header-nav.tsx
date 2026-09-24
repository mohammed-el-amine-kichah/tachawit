"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DueBadge } from "./due-count";
import { isActive, navItems } from "./nav-items";

/** Main destinations in the header on wider screens. */
export function HeaderNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {navItems.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {t(key)}
                {key === "review" && (
                  <DueBadge className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] leading-5 text-primary-foreground" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
