"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { BigButton } from "@/components/player/big-button";
import { CompletionScreen } from "@/components/player/completion-screen";
import { PlayerFooter } from "@/components/player/player-footer";
import { PlayerTopBar } from "@/components/player/player-top-bar";
import { localize } from "@/i18n/localize";
import { useProgress } from "@/components/progress/progress-provider";
import { Notice } from "@/components/shared/notice";
import { getDirection } from "@/i18n/config";
import { initialFlow, lessonFlow } from "@/lib/lesson/flow";
import type { LessonViewStep } from "@/lib/lesson/view";
import { cardSlide } from "@/lib/motion";
import { XP } from "@/lib/progress/xp";
import type { LessonView } from "@/lib/supabase/queries/lessons";
import { GlossaryContext } from "./glossary-context";
import { LessonStepView } from "./lesson-step-view";

function entriesTaught(steps: LessonViewStep[]): string[] {
  const ids = steps.flatMap((step) =>
    step.type === "introduce" || step.type === "listen_repeat"
      ? [step.entry.id]
      : step.type === "dialogue"
        ? step.lines.map((line) => line.entry.id)
        : [],
  );
  return [...new Set(ids)];
}

/** One card at a time, full screen. Audio preloads a step ahead; nothing waits on animations. */
export function LessonPlayer({
  levelId,
  lesson,
  exitHref = "/",
}: {
  /** The map level being played, or null for an admin preview (nothing is recorded). */
  levelId: string | null;
  lesson: LessonView;
  exitHref?: string;
}) {
  const t = useTranslations("Lesson");
  const locale = useLocale();
  const rtl = getDirection(locale) === "rtl";
  const heading = localize(lesson.title, locale)?.text;
  const { completeLevel } = useProgress();
  const [flow, dispatch] = useReducer(lessonFlow, initialFlow);
  const total = lesson.steps.length;
  const step = lesson.steps[flow.index];
  const words = useMemo(() => entriesTaught(lesson.steps), [lesson.steps]);
  const sectionRef = useRef<HTMLElement>(null);
  const recorded = useRef(false);

  // Warm the browser cache with the next step's audio.
  useEffect(() => {
    const next = lesson.steps[flow.index + 1];
    if (!next) return;
    const urls =
      next.type === "dialogue"
        ? next.lines.flatMap((l) => (l.audio ? [l.audio.url] : []))
        : "audio" in next && next.audio
          ? [next.audio.url]
          : [];
    const preloaders = urls.map((url) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = url;
      return audio;
    });
    return () => preloaders.forEach((audio) => audio.removeAttribute("src"));
  }, [flow.index, lesson.steps]);

  useEffect(() => {
    if (flow.index > 0) sectionRef.current?.focus({ preventScroll: true });
  }, [flow.index]);

  useEffect(() => {
    if (!flow.finished || recorded.current || !levelId) return;
    recorded.current = true;
    completeLevel({ levelId, stars: 3, xp: XP.lesson, entryIds: words });
  }, [flow.finished, completeLevel, levelId, words]);

  if (total === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PlayerTopBar value={0} label={t("progress", { current: 0, total: 0 })} heading={heading} closeHref={exitHref} />
        <main id="main" className="mx-auto w-full max-w-lg flex-1 px-5 py-10">
          <Notice>{t("empty")}</Notice>
        </main>
      </div>
    );
  }

  const custom = flow.direction * (rtl ? -1 : 1);

  return (
    <GlossaryContext value={lesson.glossary}>
      <div className="flex min-h-dvh flex-col">
        <PlayerTopBar
          value={flow.finished ? 1 : flow.index / total}
          label={t("progress", { current: flow.index + 1, total })}
          heading={heading}
          closeHref={exitHref}
        />
        <main id="main" className="relative flex flex-1 flex-col overflow-x-clip">
          {flow.finished ? (
            <CompletionScreen title={t("complete")} stars={3} xp={XP.lesson} words={words.length} continueHref={exitHref} />
          ) : (
            <AnimatePresence initial={false} mode="popLayout" custom={custom}>
              <motion.section
                key={step.id}
                ref={sectionRef}
                tabIndex={-1}
                aria-label={t("progress", { current: flow.index + 1, total })}
                custom={custom}
                variants={cardSlide}
                initial="enter"
                animate="center"
                exit="exit"
                className="mx-auto w-full max-w-lg flex-1 px-5 py-6 outline-none"
              >
                <LessonStepView step={step} />
              </motion.section>
            </AnimatePresence>
          )}
        </main>
        {!flow.finished && (
          <PlayerFooter onBack={flow.index > 0 ? () => dispatch({ type: "back" }) : undefined}>
            <BigButton onClick={() => dispatch({ type: "next", total })}>
              {flow.index === total - 1 ? t("finish") : t("continue")}
            </BigButton>
          </PlayerFooter>
        )}
      </div>
    </GlossaryContext>
  );
}
