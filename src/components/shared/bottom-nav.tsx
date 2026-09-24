"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DueBadge, useDueCount } from "./due-count";
import { isActive, navItems } from "./nav-items";

/** Thumb-reach navigation on phones. */
export function BottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const due = useDueCount();

  return (
    <nav aria-label={t("label")} className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={key} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={key === "review" && due > 0 ? t("reviewDue", { count: due }) : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("relative grid h-8 w-14 place-items-center rounded-full transition-colors", active && "bg-primary/12")}>
                  <Icon aria-hidden className="size-6" />
                  {key === "review" && (
                    <DueBadge className="absolute -top-1 end-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] leading-5 text-primary-foreground" />
                  )}
                </span>
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
