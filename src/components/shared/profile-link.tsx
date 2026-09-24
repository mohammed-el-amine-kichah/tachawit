"use client";

import { UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAccount } from "@/components/auth/account-context";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isActive } from "./nav-items";

/** The learner's corner at the end of the header: their initial once signed in, a silhouette for guests. */
export function ProfileLink() {
  const t = useTranslations("Nav");
  const user = useAccount();
  const pathname = usePathname();
  const active = isActive(pathname, "/profile");
  const initial = (user?.displayName ?? user?.email ?? "").trim().charAt(0).toLocaleUpperCase();

  return (
    <Link
      href="/profile"
      aria-label={t("profile")}
      title={t("profile")}
      aria-current={active ? "page" : undefined}
      className={cn(
        "grid size-10 place-items-center rounded-full text-sm font-semibold ring-2 transition-[transform,box-shadow] duration-150 active:scale-95",
        active ? "bg-primary text-primary-foreground ring-primary/30" : "bg-accent text-accent-foreground ring-transparent hover:ring-primary/40",
      )}
    >
      {initial ? <span aria-hidden>{initial}</span> : <UserRoundIcon aria-hidden className="size-5" />}
    </Link>
  );
}
