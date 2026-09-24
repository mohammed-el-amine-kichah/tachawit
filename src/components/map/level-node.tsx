"use client";

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { localize, type LocalizedText } from "@/i18n/localize";
import { springs } from "@/lib/motion";
import type { LevelStatus } from "@/lib/progress/types";
import type { LevelType } from "@/lib/supabase/queries/units";
import { cn } from "@/lib/utils";
import { CelebrationStars } from "./celebration-stars";
import { LevelIcon } from "./level-icon";
import { LevelStars } from "./level-stars";
import { MapAvatar } from "./map-avatar";
import { UnlockBurst } from "./unlock-burst";

export type NodeStatus = LevelStatus | "pending";

const statusClassName: Record<NodeStatus, string> = {
  pending: "bg-card text-muted-foreground",
  locked: "bg-muted text-muted-foreground",
  available: "bg-card text-primary ring-3 ring-primary",
  current: "bg-primary text-primary-foreground ring-4 ring-gold/60",
  completed: "bg-gold text-gold-foreground",
};

export function LevelNode({
  id,
  number,
  type,
  title,
  status,
  stars,
  left,
  top,
  celebrate,
}: {
  id: string;
  number: number;
  type: LevelType;
  title: LocalizedText | null;
  status: NodeStatus;
  stars: number;
  /** Horizontal position as a percentage of the path column. */
  left: number;
  top: number;
  celebrate: "completed" | "unlocked" | null;
}) {
  const t = useTranslations("Map");
  const levelType = useTranslations("LevelType");
  const locale = useLocale();
  const [hintKey, setHintKey] = useState(0);
  const label = localize(title, locale)?.text ?? t("untitled", { number });

  useEffect(() => {
    if (hintKey === 0) return;
    const timer = setTimeout(() => setHintKey(0), 2600);
    return () => clearTimeout(timer);
  }, [hintKey]);

  const ariaLabel = [
    label,
    levelType(type),
    t(`status.${status}`),
    status === "completed" ? t("stars", { count: stars }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const face = <LevelIcon type={type} locked={status === "locked"} className="size-7" />;
  const faceClassName = cn(
    "relative grid size-16 place-items-center rounded-full border-b-[6px] border-shade shadow-soft outline-offset-4 transition-transform duration-150 active:translate-y-1 active:border-b-2",
    statusClassName[status],
  );

  return (
    <div
      id={`level-${id}`}
      className="pointer-events-auto absolute size-16 -translate-x-1/2 -translate-y-1/2 scroll-my-40"
      style={{ left: `${left}%`, top }}
    >
      {(status === "current" || status === "available") && (
        <span aria-hidden className="absolute inset-0 rounded-full bg-primary/30 motion-safe:animate-node-pulse" />
      )}

      {status === "current" && (
        <span className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 motion-safe:animate-avatar-bob">
          <MapAvatar />
        </span>
      )}

      {status === "completed" && (
        <motion.span
          className="absolute -top-6 left-1/2 -translate-x-1/2"
          initial={celebrate === "completed" ? { scale: 0.4, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springs.pop, delay: 0.75 }}
        >
          <LevelStars stars={stars} />
        </motion.span>
      )}

      <motion.div
        initial={celebrate === "unlocked" ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={{ ...springs.pop, delay: 1.5 }}
        className={cn(hintKey > 0 && "motion-safe:animate-nudge")}
        key={hintKey > 0 ? `nudge-${hintKey}` : "still"}
      >
        {status === "locked" ? (
          <button
            type="button"
            aria-label={ariaLabel}
            aria-disabled
            aria-describedby={hintKey > 0 ? `hint-${id}` : undefined}
            className={faceClassName}
            onClick={() => setHintKey((k) => k + 1)}
          >
            {face}
          </button>
        ) : (
          <Link href={`/level/${id}`} aria-label={ariaLabel} className={faceClassName}>
            {face}
          </Link>
        )}
      </motion.div>

      {celebrate === "completed" && <CelebrationStars count={Math.max(stars, 1)} />}
      {celebrate === "unlocked" && <UnlockBurst />}

      <span
        aria-hidden
        className={cn(
          "absolute top-full left-1/2 mt-2.5 max-w-40 -translate-x-1/2 truncate rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-soft backdrop-blur",
          status === "current" ? "bg-primary text-primary-foreground" : "bg-card/90 text-foreground",
        )}
      >
        {label}
      </span>

      {hintKey > 0 && (
        <span
          id={`hint-${id}`}
          role="status"
          className="absolute bottom-full left-1/2 z-30 mb-3 w-48 -translate-x-1/2 rounded-xl bg-popover px-3 py-2 text-center text-xs text-popover-foreground shadow-raised"
        >
          {t("lockedHint")}
        </span>
      )}
    </div>
  );
}
