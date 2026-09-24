import type { SrsState } from "@/lib/progress/snapshot";

// SM-2 spaced repetition: answer quality 0–5, ease never below 1.3.

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS).toISOString();

/** A word just learned in a lesson or quiz: first review tomorrow. */
export function newSrsState(now: Date): SrsState {
  return { ease: 2.5, intervalDays: 1, repetitions: 0, lapses: 0, dueAt: addDays(now, 1), lastReviewedAt: null };
}

export function review(state: SrsState, grade: number, now: Date): SrsState {
  const q = Math.min(5, Math.max(0, Math.round(grade)));
  const ease = Math.max(MIN_EASE, state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (q < 3) {
    return { ease, intervalDays: 1, repetitions: 0, lapses: state.lapses + 1, dueAt: addDays(now, 1), lastReviewedAt: now.toISOString() };
  }

  const repetitions = state.repetitions + 1;
  const intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(state.intervalDays * state.ease);
  return { ease, intervalDays, repetitions, lapses: state.lapses, dueAt: addDays(now, intervalDays), lastReviewedAt: now.toISOString() };
}

/** Quality of a review answer: right first time is "good", a miss is a lapse. */
export function gradeFor(firstTry: boolean): number {
  return firstTry ? 4 : 1;
}

/** Entries due for review now, most overdue first. */
export function dueEntryIds(srs: Readonly<Record<string, SrsState>>, now: Date, limit: number): string[] {
  return Object.entries(srs)
    .filter(([, state]) => Date.parse(state.dueAt) <= now.getTime())
    .sort(([, a], [, b]) => Date.parse(a.dueAt) - Date.parse(b.dueAt))
    .slice(0, limit)
    .map(([id]) => id);
}
