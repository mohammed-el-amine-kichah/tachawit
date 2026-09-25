import type { LevelType } from "@/lib/supabase/queries/units";
import { itemIssues, referencedEntryIds, type DraftItem } from "./builder";

// What stands between a lesson or quiz and its learners. Learners only see it when the lesson or
// quiz, every word it uses, one of its levels and that level's unit are all published; audio also
// needs a published recording from a consenting speaker. The database enforces each of these
// separately; this gathers them in one place and plans how to publish them in one go.

type Status = "draft" | "published";

export type ReadinessClip = { id: string; status: Status; isPrimary: boolean; consent: boolean; speaker: string | null };
export type ReadinessEntry = { id: string; text: string; status: Status; clips: ReadinessClip[] };
export type ReadinessLevel = { id: string; position: number; title: unknown; status: Status; unit: { id: string; title: unknown; status: Status } };

export type ReadinessInput = {
  kind: "lesson" | "quiz";
  status: Status;
  items: DraftItem[];
  entries: ReadinessEntry[];
  levels: ReadinessLevel[];
};

/** Everything to publish, in the order the database accepts it: recordings, words, content, levels, units. */
export type PublishPlan = { clipIds: string[]; entryIds: string[]; content: boolean; levelIds: string[]; unitIds: string[] };

/** The optional parts of a plan the admin kept ticked. Words and the content itself are never optional. */
export type PublishSelection = Pick<PublishPlan, "clipIds" | "levelIds" | "unitIds">;

export type Readiness = {
  /** Steps or questions still missing something. */
  incomplete: number;
  empty: boolean;
  /** Words that were deleted but are still referenced. */
  missingEntryIds: string[];
  /** Words learners won't hear, even after the plan is carried out. */
  silentEntryIds: string[];
  /** Recordings of those words that can't be published: the speaker has not consented. */
  noConsentClipIds: string[];
  onMap: boolean;
  /** Learners can open it right now. */
  live: boolean;
  canPublish: boolean;
  plan: PublishPlan;
};

const audible = (clip: ReadinessClip) => clip.status === "published" && clip.consent;

/** The recording to publish for a word nobody can hear yet: its primary one if possible. */
function clipToPublish(entry: ReadinessEntry): ReadinessClip | undefined {
  const candidates = entry.clips.filter((c) => c.status === "draft" && c.consent);
  return candidates.find((c) => c.isPrimary) ?? candidates[0];
}

export function readiness({ status, kind, items, entries, levels }: ReadinessInput): Readiness {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const used = referencedEntryIds(items);
  const present = used.flatMap((id) => byId.get(id) ?? []);
  const missingEntryIds = used.filter((id) => !byId.has(id));
  const incomplete = Object.keys(itemIssues(kind, items)).length;

  const clipIds: string[] = [];
  const silentEntryIds: string[] = [];
  const noConsentClipIds: string[] = [];
  for (const entry of present) {
    if (entry.clips.some(audible)) continue;
    const clip = clipToPublish(entry);
    if (clip) {
      clipIds.push(clip.id);
      continue;
    }
    silentEntryIds.push(entry.id);
    noConsentClipIds.push(...entry.clips.filter((c) => c.status === "draft" && !c.consent).map((c) => c.id));
  }

  const draftLevels = levels.filter((l) => l.status === "draft");
  const unitIds = [...new Set(levels.filter((l) => l.unit.status === "draft").map((l) => l.unit.id))];

  return {
    incomplete,
    empty: items.length === 0,
    missingEntryIds,
    silentEntryIds,
    noConsentClipIds,
    onMap: levels.length > 0,
    live: status === "published" && levels.some((l) => l.status === "published" && l.unit.status === "published"),
    canPublish: items.length > 0 && incomplete === 0 && missingEntryIds.length === 0,
    plan: {
      clipIds,
      entryIds: present.filter((e) => e.status === "draft").map((e) => e.id),
      content: status === "draft",
      levelIds: draftLevels.map((l) => l.id),
      unitIds,
    },
  };
}

export function isPlanEmpty(plan: PublishPlan): boolean {
  return !plan.content && [plan.clipIds, plan.entryIds, plan.levelIds, plan.unitIds].every((ids) => ids.length === 0);
}

/** The plan limited to what the admin kept ticked; anything not in the plan is ignored. */
export function applySelection(plan: PublishPlan, selection: PublishSelection): PublishPlan {
  const keep = (planned: string[], chosen: string[]) => planned.filter((id) => chosen.includes(id));
  return {
    clipIds: keep(plan.clipIds, selection.clipIds),
    entryIds: plan.entryIds,
    content: plan.content,
    levelIds: keep(plan.levelIds, selection.levelIds),
    unitIds: keep(plan.unitIds, selection.unitIds),
  };
}

export type LevelBlocker = "level_draft" | "content_draft" | "no_content" | "unit_draft";

/** Why learners can't see a level yet; empty when they can. `contentStatus` is null when nothing is linked. */
export function levelBlockers(level: { type: LevelType; status: Status; contentStatus: Status | null }, unitStatus: Status): LevelBlocker[] {
  const blockers: LevelBlocker[] = [];
  if (level.status === "draft") blockers.push("level_draft");
  if (level.type !== "review") {
    if (level.contentStatus === null) blockers.push("no_content");
    else if (level.contentStatus === "draft") blockers.push("content_draft");
  }
  if (unitStatus === "draft") blockers.push("unit_draft");
  return blockers;
}
