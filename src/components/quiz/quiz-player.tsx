"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { GlossaryContext } from "@/components/lesson/glossary-context";
import { BigButton } from "@/components/player/big-button";
import { CompletionScreen } from "@/components/player/completion-screen";
import { PlayerFooter } from "@/components/player/player-footer";
import { PlayerTopBar } from "@/components/player/player-top-bar";
import { useProgress } from "@/components/progress/progress-provider";
import { Notice } from "@/components/shared/notice";
import { playSound } from "@/lib/audio/sfx";
import { cardSlide } from "@/lib/motion";
import { buildQuizItems, type QuizItem } from "@/lib/quiz/build";
import { initialSession, quizScore, quizSession, starsFor, xpFor } from "@/lib/quiz/session";
import type { QuizView } from "@/lib/supabase/queries/quizzes";
import { FeedbackSheet } from "./feedback-sheet";
import { QuestionView } from "./question-view";

function answerOf(item: QuizItem) {
  return item.type === "match_pairs" ? null : item.answer;
}

function entryIdsOf(items: QuizItem[]): string[] {
  const ids = items.flatMap((item) => (item.type === "match_pairs" ? item.pairs.map((p) => p.id) : [item.answer.id]));
  return [...new Set(ids)];
}

/** Questions one at a time, instant feedback, no hearts: misses come back at the end. */
export function QuizPlayer({ levelId, quiz, seed }: { levelId: string; quiz: QuizView; seed: number }) {
  const t = useTranslations("Quiz");
  const { completeLevel } = useProgress();
  const items = useMemo(() => buildQuizItems(quiz.questions, quiz.entries, seed), [quiz, seed]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const [session, dispatch] = useReducer(quizSession, items.map((item) => item.id), initialSession);
  const [check, setCheck] = useState<(() => boolean) | null>(null);
  const recorded = useRef(false);

  const onCheckChange = useCallback((next: (() => boolean) | null) => setCheck(() => next), []);
  const answer = useCallback((correct: boolean) => {
    playSound(correct ? "correct" : "wrong");
    dispatch({ type: "answer", correct });
  }, []);

  const score = quizScore(session.results);
  const stars = starsFor(score.accuracy);
  const xp = xpFor(score);
  const words = useMemo(() => entryIdsOf(items), [items]);

  useEffect(() => {
    if (!session.finished || recorded.current || items.length === 0) return;
    recorded.current = true;
    completeLevel({ levelId, stars, xp, entryIds: words });
  }, [session.finished, completeLevel, levelId, stars, xp, words, items.length]);

  const progressLabel = t("progress", { current: Math.min(session.position + 1, session.queue.length), total: session.queue.length });

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PlayerTopBar value={0} label={progressLabel} />
        <main id="main" className="mx-auto w-full max-w-lg flex-1 px-5 py-10">
          <Notice>{t("empty")}</Notice>
        </main>
      </div>
    );
  }

  const item = byId.get(session.queue[session.position]);
  const status = session.feedback ?? "answering";

  return (
    <GlossaryContext value={quiz.glossary}>
      <div className="flex min-h-dvh flex-col">
        <PlayerTopBar value={session.finished ? 1 : session.position / session.queue.length} label={progressLabel} />
        <main id="main" className="relative flex flex-1 flex-col overflow-x-clip">
          {session.finished || !item ? (
            <CompletionScreen title={t("complete")} stars={stars} xp={xp} words={words.length}>
              <p className="text-muted-foreground">{t("firstTry", { count: score.firstTry, total: score.total })}</p>
            </CompletionScreen>
          ) : (
            <AnimatePresence initial={false} mode="popLayout" custom={1}>
              <motion.section
                key={`${item.id}-${session.position}`}
                aria-label={progressLabel}
                custom={1}
                variants={cardSlide}
                initial="enter"
                animate="center"
                exit="exit"
                className="mx-auto w-full max-w-lg flex-1 px-5 py-6"
              >
                <QuestionView item={item} status={status} seed={seed + session.position} onCheckChange={onCheckChange} onAnswer={answer} />
              </motion.section>
            </AnimatePresence>
          )}
        </main>
        {!session.finished && item && session.feedback === null && item.type !== "match_pairs" && (
          <PlayerFooter>
            <BigButton disabled={!check} onClick={() => check && answer(check())}>
              {item.type === "speak" ? t("saidIt") : t("check")}
            </BigButton>
          </PlayerFooter>
        )}
        {!session.finished && item && session.feedback !== null && (
          <FeedbackSheet
            correct={session.feedback === "correct"}
            answer={answerOf(item)}
            praiseIndex={session.position}
            onContinue={() => {
              setCheck(null);
              dispatch({ type: "continue" });
            }}
          />
        )}
      </div>
    </GlossaryContext>
  );
}
