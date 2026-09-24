"use client";

import { BookOpenCheckIcon, StarIcon, ZapIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Confetti } from "@/components/shared/confetti";
import { ZMark } from "@/components/shared/z-mark";
import { Link } from "@/i18n/navigation";
import { playSound } from "@/lib/audio/sfx";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { BigButton } from "./big-button";

/** End of a lesson, quiz or review: stars, XP and words, with a celebration. Continue is available at once. */
export function CompletionScreen({
  title,
  stars,
  xp,
  words,
  children,
}: {
  title: string;
  stars: number | null;
  xp: number;
  words: number;
  children?: React.ReactNode;
}) {
  const t = useTranslations("Player");

  useEffect(() => {
    playSound("complete");
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-5 py-8 text-center">
      <Confetti />
      <ZMark className="size-12 text-primary" />
      <h1 className="text-3xl font-semibold">{title}</h1>

      {stars !== null && (
        <div className="flex items-end gap-2" role="img" aria-label={t("stars", { count: stars })}>
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springs.pop, delay: 0.2 + n * 0.18 }}
            >
              <StarIcon
                aria-hidden
                className={cn(
                  n === 2 ? "size-20" : "size-14",
                  n <= stars ? "fill-gold stroke-gold-foreground/40" : "fill-muted stroke-muted-foreground/30",
                )}
              />
            </motion.span>
          ))}
        </div>
      )}

      <div className="grid w-full grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border">
          <ZapIcon aria-hidden className="mx-auto size-6 fill-gold stroke-gold-foreground/40" />
          <p className="mt-1 font-heading text-2xl font-semibold">{t("xp", { xp })}</p>
          <p className="text-xs text-muted-foreground">{t("xpLabel")}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border">
          <BookOpenCheckIcon aria-hidden className="mx-auto size-6 text-success" />
          <p className="mt-1 font-heading text-2xl font-semibold">{words}</p>
          <p className="text-xs text-muted-foreground">{t("words", { count: words })}</p>
        </div>
      </div>

      {children}

      <div className="mt-auto flex w-full pt-4">
        <BigButton asChild autoFocus>
          <Link href="/">{t("continue")}</Link>
        </BigButton>
      </div>
    </div>
  );
}
