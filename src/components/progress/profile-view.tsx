"use client";

import { BookOpenCheckIcon, FlameIcon, LandmarkIcon, LogOutIcon, ShieldIcon, ZapIcon, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { signOut } from "@/app/actions/auth";
import { forgetKeptPages } from "@/lib/offline/client";
import { useAccount } from "@/components/auth/account-context";
import { DisplayNameForm } from "@/components/auth/display-name-form";
import { Motif } from "@/components/shared/motif";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { Link } from "@/i18n/navigation";
import { displayStreak, localDate } from "@/lib/progress/streak";
import { dueEntryIds } from "@/lib/srs/sm2";
import { PreferencesSection } from "./preferences-section";
import { useProgress } from "./progress-provider";

function Stat({ icon: Icon, value, label, className }: { icon: LucideIcon; value: number | null; label: string; className: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border">
      <Icon aria-hidden className={className} />
      {value === null ? <Skeleton className="mt-2 h-8 w-12" /> : <p className="mt-2 font-heading text-3xl font-semibold">{value}</p>}
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** XP, streak, words learned and units completed, the learner's preferences, and the account (or the invitation to create one). */
export function ProfileView({ units, now }: { units: { id: string; levelIds: string[] }[]; now: number }) {
  const t = useTranslations("Profile");
  const hydrated = useHydrated();
  const user = useAccount();
  const { snapshot, ready } = useProgress();
  const show = hydrated && ready;

  const stats = useMemo(() => {
    const done = (id: string) => snapshot.levels[id]?.completedAt != null;
    return {
      streak: displayStreak(snapshot.streak, localDate(new Date(now))),
      words: Object.keys(snapshot.srs).length,
      units: units.filter((u) => u.levelIds.length > 0 && u.levelIds.every(done)).length,
      due: dueEntryIds(snapshot.srs, new Date(now), 1000).length,
    };
  }, [snapshot, units, now]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold" dir="auto">
        {user ? (user.displayName ?? user.email?.split("@")[0] ?? t("title")) : t("guestName")}
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={ZapIcon} value={show ? snapshot.xp : null} label={t("xp")} className="size-7 fill-gold stroke-gold-foreground/40" />
        <Stat icon={FlameIcon} value={show ? stats.streak : null} label={t("streak")} className="size-7 fill-primary/80 stroke-primary" />
        <Stat icon={BookOpenCheckIcon} value={show ? stats.words : null} label={t("words")} className="size-7 text-success" />
        <Stat icon={LandmarkIcon} value={show ? stats.units : null} label={t("units")} className="size-7 text-secondary" />
      </div>
      {show && snapshot.streak.longest > 0 && <p className="text-sm text-muted-foreground">{t("longest", { count: snapshot.streak.longest })}</p>}

      {show && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-accent p-4 text-accent-foreground">
          <p className="font-semibold">{t("reviewCta", { count: stats.due })}</p>
          {stats.due > 0 && (
            <Button asChild className="rounded-full">
              <Link href="/review">{t("review")}</Link>
            </Button>
          )}
        </div>
      )}

      <PreferencesSection />

      <section className="overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-border">
        <Motif variant="band" className="h-2.5" />
        <div className="flex flex-col gap-4 p-5">
          {user ? (
            <>
              {user.email && <p className="text-sm text-muted-foreground" dir="auto">{t("signedInAs", { email: user.email })}</p>}
              <DisplayNameForm current={user.displayName} />
              <div className="flex flex-wrap gap-2">
                {user.role === "admin" && (
                  <Button asChild variant="secondary">
                    <Link href="/admin">
                      <ShieldIcon aria-hidden />
                      {t("admin")}
                    </Link>
                  </Button>
                )}
                <form action={signOut} onSubmit={forgetKeptPages}>
                  <Button type="submit" variant="outline">
                    <LogOutIcon aria-hidden className="rtl:-scale-x-100" />
                    {t("signOut")}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">{t("guestTitle")}</h2>
              <p className="text-muted-foreground">{t("guestLead")}</p>
              <Button asChild size="lg" className="h-12 rounded-xl">
                <Link href="/login">{t("saveProgress")}</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
