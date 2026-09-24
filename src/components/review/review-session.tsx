"use client";

import { CalendarCheckIcon, RotateCcwIcon, SproutIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useMemo, useState, useTransition } from "react";
import { loadReviewEntries, type ReviewData } from "@/app/actions/review";
import { BigButton } from "@/components/player/big-button";
import { PlayerTopBar } from "@/components/player/player-top-bar";
import { useProgress } from "@/components/progress/progress-provider";
import { Notice } from "@/components/shared/notice";
import { ZMark } from "@/components/shared/z-mark";
import { QuizPlayer, type QuizSummary } from "@/components/quiz/quiz-player";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { Link } from "@/i18n/navigation";
import { XP } from "@/lib/progress/xp";
import { buildReviewQuestions } from "@/lib/review/build";
import { dueEntryIds, gradeFor } from "@/lib/srs/sm2";

const SESSION_SIZE = 15;
const reviewScoring = (score: { total: number }) => ({ stars: null, xp: XP.reviewPerItem * score.total });

/** The daily review: words that are due, as a quiz. Results reschedule each word (SM-2). */
export function ReviewSession({ levelId, seed, now }: { levelId: string | null; seed: number; now: number }) {
  const t = useTranslations("Review");
  const format = useFormatter();
  const hydrated = useHydrated();
  const { snapshot, ready, recordReview, completeLevel } = useProgress();
  const [session, setSession] = useState<{ ids: string[]; data: ReviewData } | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const learned = Object.keys(snapshot.srs);
  const due = useMemo(() => dueEntryIds(snapshot.srs, new Date(now), SESSION_SIZE), [snapshot.srs, now]);
  const upcoming = useMemo(
    () => dueEntryIds(snapshot.srs, new Date(8.64e15), SESSION_SIZE),
    [snapshot.srs],
  );
  const nextDue = upcoming[0] ? new Date(snapshot.srs[upcoming[0]].dueAt) : null;

  const start = (ids: string[]) =>
    startTransition(async () => {
      try {
        setFailed(false);
        setSession({ ids, data: await loadReviewEntries(ids) });
      } catch {
        setFailed(true);
      }
    });

  const onComplete = useCallback(
    (summary: QuizSummary) => {
      const grades = Object.fromEntries(
        Object.entries(summary.results).flatMap(([questionId, result]) =>
          (summary.entriesByQuestion[questionId] ?? []).map((entryId) => [entryId, gradeFor(result.firstTry)]),
        ),
      );
      recordReview({ grades, xp: summary.xp });
      if (levelId) completeLevel({ levelId, stars: 3, xp: 0, entryIds: [] });
    },
    [recordReview, completeLevel, levelId],
  );

  const questions = useMemo(
    () => (session ? buildReviewQuestions(session.ids, session.data.entries, seed) : []),
    [session, seed],
  );

  if (session && questions.length > 0) {
    return (
      <QuizPlayer
        questions={questions}
        entries={session.data.entries}
        glossary={session.data.glossary}
        seed={seed}
        title={t("complete")}
        onComplete={onComplete}
        scoring={reviewScoring}
      />
    );
  }

  const loading = !hydrated || !ready;

  return (
    <div className="flex min-h-dvh flex-col">
      <PlayerTopBar value={0} label={t("title")} />
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-5 py-10 text-center">
        <ZMark className="size-12 text-primary" />
        <h1 className="text-3xl font-semibold">{t("title")}</h1>

        {loading ? (
          <p className="text-muted-foreground">{t("loading")}</p>
        ) : learned.length === 0 ? (
          <>
            <SproutIcon aria-hidden className="size-14 text-success" />
            <p className="text-lg font-semibold">{t("nothing")}</p>
            <p className="text-muted-foreground">{t("nothingLead")}</p>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/">{t("backToMap")}</Link>
            </Button>
          </>
        ) : due.length === 0 ? (
          <>
            <CalendarCheckIcon aria-hidden className="size-14 text-success" />
            <p className="text-lg font-semibold">{t("allDone")}</p>
            {nextDue && <p className="text-muted-foreground">{t("allDoneLead", { when: format.relativeTime(nextDue, now) })}</p>}
            <div className="mt-auto flex w-full flex-col gap-3">
              <BigButton onClick={() => start(upcoming.slice(0, 10))} disabled={pending} variant="secondary">
                <RotateCcwIcon aria-hidden />
                {t("practice")}
              </BigButton>
              <Button asChild variant="ghost" size="lg">
                <Link href="/">{t("backToMap")}</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-lg">{t("dueCount", { count: due.length })}</p>
            <p className="text-muted-foreground">{t("lead")}</p>
            <div className="mt-auto flex w-full">
              <BigButton onClick={() => start(due)} disabled={pending}>
                {pending ? t("loading") : t("start")}
              </BigButton>
            </div>
          </>
        )}
        {failed && <Notice>{t("error")}</Notice>}
        {session && questions.length === 0 && <Notice>{t("unavailable")}</Notice>}
      </main>
    </div>
  );
}
