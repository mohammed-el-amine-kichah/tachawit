import { lessonStepSchema, type LessonStepType } from "@/lib/content/lesson";
import { quizQuestionSchema, type QuizQuestionType } from "@/lib/content/quiz";
import type { MapPosition } from "@/lib/content/unlock-rule";

// Helpers for the lesson/quiz builders and the map editor. Drafts may be incomplete; these
// report what is missing so the admin knows what to fix before publishing.

export type DraftItem = { id: string; type: string; [key: string]: unknown };

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return [...items];
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** A short id like "s5", unique among the given items. */
export function nextId(items: readonly { id: string }[], prefix: string): string {
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  const highest = items.reduce((max, item) => Math.max(max, Number(pattern.exec(item.id)?.[1] ?? 0)), 0);
  return `${prefix}${highest + 1}`;
}

export function blankStep(type: LessonStepType, id: string): DraftItem {
  switch (type) {
    case "introduce":
    case "listen_repeat":
      return { id, type, entryId: "" };
    case "culture_note":
      return { id, type };
    case "dialogue":
      return { id, type, lines: [] };
  }
}

export function blankQuestion(type: QuizQuestionType, id: string): DraftItem {
  switch (type) {
    case "listen_pick_translation":
    case "pick_audio":
      return { id, type, entryId: "", distractorEntryIds: [] };
    case "build_sentence":
    case "speak":
      return { id, type, entryId: "" };
    case "match_pairs":
      return { id, type, entryIds: [] };
    case "fill_blank":
      return { id, type, entryId: "", blankWordIndex: 0, distractorEntryIds: [] };
  }
}

export type ItemIssue = "entry" | "distractors" | "pairs" | "blank" | "lines" | "body" | "invalid";

function issueFor(kind: "lesson" | "quiz", item: DraftItem): ItemIssue | null {
  const parsed = (kind === "lesson" ? lessonStepSchema : quizQuestionSchema).safeParse(item);
  if (parsed.success) return null;
  const path = String(parsed.error.issues[0]?.path[0] ?? "");
  if (path === "entryId") return "entry";
  if (path === "distractorEntryIds") return "distractors";
  if (path === "entryIds") return "pairs";
  if (path === "blankWordIndex") return "blank";
  if (path === "lines") return "lines";
  if (path === "") {
    if (item.type === "culture_note") return "body";
    if (item.type === "match_pairs") return "pairs";
    return "distractors";
  }
  return "invalid";
}

/** What each incomplete step or question is missing, by id. Empty when everything is ready. */
export function itemIssues(kind: "lesson" | "quiz", items: readonly DraftItem[]): Record<string, ItemIssue> {
  const issues: Record<string, ItemIssue> = {};
  for (const item of items) {
    const issue = issueFor(kind, item);
    if (issue) issues[item.id] = issue;
  }
  return issues;
}

/** Where a newly added level appears on its unit map: at the bottom, across from the last one. */
export function nextNodePosition(existing: readonly MapPosition[]): MapPosition {
  const last = existing.at(-1);
  if (!last) return { x: 0.5, y: 0.1 };
  return { x: last.x < 0.5 ? 0.7 : 0.3, y: 0.9 };
}

/** An even, winding layout for `count` nodes. */
export function autoArrange(count: number): MapPosition[] {
  if (count === 1) return [{ x: 0.5, y: 0.5 }];
  return Array.from({ length: count }, (_, i) => ({
    x: i === 0 ? 0.5 : i % 2 === 1 ? 0.25 : 0.75,
    y: Math.round((0.1 + (i * 0.8) / (count - 1)) * 1000) / 1000,
  }));
}
