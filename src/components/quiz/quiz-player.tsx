"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { GlossaryContext } from "@/components/lesson/glossary-context";
import { BigButton } from "@/components/player/big-button";
import { CompletionScreen } from "@/components/player/completion-screen";
import { PlayerFooter } from "@/components/player/player-footer";
import { PlayerTopBar } from "@/components/player/player-top-bar";
import { Notice } from "@/components/shared/notice";
import { playSound } from "@/lib/audio/sfx";
import { cardSlide } from "@/lib/motion";
import type { QuizQuestion } from "@/lib/content/quiz";
import type { Glossary, ViewEntry } from "@/lib/lesson/view";
import { buildQuizItems, type QuizItem } from "@/lib/quiz/build";
import { initialSession, quizScore, quizSession, starsFor, xpFor, type QuestionResult, type QuizScore } from "@/lib/quiz/session";
import { FeedbackSheet } from "./feedback-sheet";
import { QuestionView } from "./question-view";

function answerOf(item: QuizItem) {
  return item.type === "match_pairs" ? null : item.answer;
}

function entryIdsOf(item: QuizItem): string[] {
  return item.type === "match_pairs" ? item.pairs.map((p) => p.id) : [item.answer.id];
}

export type QuizSummary = {
  stars: number | null;
  xp: number;
  /** Result per question id, and the entries each question practised. */
  results: Record<string, QuestionResult>;
  entriesByQuestion: Record<string, string[]>;
  words: string[];
};

const quizScoring = (score: QuizScore) => ({ stars: starsFor(score.accuracy), xp: xpFor(score) });

/** Questions one at a time, instant feedback, no hearts: misses come back at the end. */
export function QuizPlayer({
  questions,
  entries,
  glossary,
  seed,
  title,
  onComplete,
  scoring = quizScoring,
  exitHref = "/",
}: {
  exitHref?: string;
  questions: QuizQuestion[];
  entries: Record<string, ViewEntry>;
  glossary: Glossary;
  seed: number;
  /** Heading of the completion screen. */
  title: string;
  onComplete: (summary: QuizSummary) => void;
  scoring?: (score: QuizScore) => { stars: number | null; xp: number };
}) {
  const t = useTranslations("Quiz");
  const items = useMemo(() => buildQuizItems(questions, entries, seed), [questions, entries, seed]);
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
  const { stars, xp } = scoring(score);
  const entriesByQuestion = useMemo(() => Object.fromEntries(items.map((item) => [item.id, entryIdsOf(item)])), [items]);
  const words = useMemo(() => [...new Set(Object.values(entriesByQuestion).flat())], [entriesByQuestion]);

  useEffect(() => {
    if (!session.finished || recorded.current || items.length === 0) return;
    recorded.current = true;
    onComplete({ stars, xp, results: session.results, entriesByQuestion, words });
  }, [session.finished, session.results, onComplete, stars, xp, entriesByQuestion, words, items.length]);

  const progressLabel = t("progress", { current: Math.min(session.position + 1, session.queue.length), total: session.queue.length });

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PlayerTopBar value={0} label={progressLabel} closeHref={exitHref} />
        <main id="main" className="mx-auto w-full max-w-lg flex-1 px-5 py-10">
          <Notice>{t("empty")}</Notice>
        </main>
      </div>
    );
  }

  const item = byId.get(session.queue[session.position]);
  const status = session.feedback ?? "answering";

  return (
    <GlossaryContext value={glossary}>
      <div className="flex min-h-dvh flex-col">
        <PlayerTopBar value={session.finished ? 1 : session.position / session.queue.length} label={progressLabel} closeHref={exitHref} />
        <main id="main" className="relative flex flex-1 flex-col overflow-x-clip">
          {session.finished || !item ? (
            <CompletionScreen title={title} stars={stars} xp={xp} words={words.length} continueHref={exitHref}>
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
