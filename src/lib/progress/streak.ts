export type Streak = { current: number; longest: number; lastActiveOn: string | null };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from one calendar date (YYYY-MM-DD) to another. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/**
 * The streak after an activity on `today` (the learner's local calendar date).
 * Same rules as public.next_streak() in the database.
 */
export function nextStreak(streak: Streak, today: string): Streak {
  const gap = streak.lastActiveOn === null ? null : daysBetween(streak.lastActiveOn, today);
  if (gap !== null && gap <= 0) return streak;
  const current = gap === 1 ? streak.current + 1 : 1;
  return { current, longest: Math.max(streak.longest, current), lastActiveOn: today };
}

/** The streak to show: still alive if the learner was active today or yesterday. */
export function displayStreak(streak: Streak, today: string): number {
  if (streak.lastActiveOn === null) return 0;
  return daysBetween(streak.lastActiveOn, today) <= 1 ? streak.current : 0;
}

/** The learner's calendar date in their own time zone, as YYYY-MM-DD. */
export function localDate(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
