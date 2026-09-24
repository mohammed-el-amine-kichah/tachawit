"use client";

import { CheckCircle2Icon, Volume2Icon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { BigButton } from "@/components/player/big-button";
import { LocalizedContent } from "@/components/shared/localized-content";
import { TachawitText } from "@/components/shared/tachawit-text";
import { playOnce } from "@/lib/audio/bus";
import type { ViewEntry } from "@/lib/lesson/view";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/utils";

const PRAISE = ["great", "wellDone", "exactly", "nice"] as const;

/** Slides up after checking. Wrong answers are met gently: the right answer is shown and played. */
export function FeedbackSheet({
  correct,
  answer,
  praiseIndex,
  onContinue,
}: {
  correct: boolean;
  /** The right answer, shown (and heard) after a miss. */
  answer: ViewEntry | null;
  praiseIndex: number;
  onContinue: () => void;
}) {
  const t = useTranslations("Quiz");

  useEffect(() => {
    if (!correct && answer?.audio) {
      const timer = setTimeout(() => void playOnce(answer.audio!.url), 450);
      return () => clearTimeout(timer);
    }
  }, [correct, answer]);

  return (
    <motion.div
      role="status"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={springs.press}
      className={cn(
        "sticky bottom-0 z-30 border-t-4",
        correct ? "border-success bg-success/10" : "border-gold bg-accent",
      )}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-3 bg-background/80 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        {correct ? (
          <p className="flex items-center gap-2 text-xl font-semibold text-success">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springs.pop}>
              <CheckCircle2Icon aria-hidden className="size-7" />
            </motion.span>
            {t(`praise.${PRAISE[praiseIndex % PRAISE.length]}`)}
          </p>
        ) : (
          <div>
            <p className="font-semibold text-accent-foreground">{t("wrongTitle")}</p>
            {answer && (
              <div className="mt-1 flex items-center gap-3">
                <TachawitText entry={answer} className="text-2xl font-semibold" />
                <LocalizedContent value={answer.translations} className="text-muted-foreground" />
                {answer.audio && (
                  <button
                    type="button"
                    onClick={() => void playOnce(answer.audio!.url)}
                    aria-label={t("playAnswer")}
                    className="ms-auto grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Volume2Icon aria-hidden className="size-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <BigButton onClick={onContinue} autoFocus className={cn(correct ? "bg-success text-success-foreground hover:bg-success/90" : "")}>
          {t("continue")}
        </BigButton>
      </div>
    </motion.div>
  );
}
