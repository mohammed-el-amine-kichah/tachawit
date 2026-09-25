import { describe, expect, it } from "vitest";
import { applySelection, levelBlockers, readiness, type ReadinessClip, type ReadinessEntry, type ReadinessInput, type ReadinessLevel } from "./readiness";

const E1 = "30000000-0000-4000-8000-000000000001";
const E2 = "30000000-0000-4000-8000-000000000002";
const GONE = "30000000-0000-4000-8000-00000000dead";

const clip = (id: string, over: Partial<ReadinessClip> = {}): ReadinessClip => ({ id, status: "draft", isPrimary: false, consent: true, speaker: "Speaker", ...over });
const entry = (id: string, clips: ReadinessClip[], status: "draft" | "published" = "draft"): ReadinessEntry => ({ id, text: id.slice(-1), status, clips });
const level = (id: string, status: "draft" | "published", unitStatus: "draft" | "published", unitId = "u1"): ReadinessLevel => ({
  id,
  position: 1,
  title: null,
  status,
  unit: { id: unitId, title: null, status: unitStatus },
});

function lesson(over: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    kind: "lesson",
    status: "draft",
    items: [
      { id: "s1", type: "introduce", entryId: E1 },
      { id: "s2", type: "listen_repeat", entryId: E2 },
    ],
    entries: [entry(E1, [clip("c1", { isPrimary: true })]), entry(E2, [clip("c2", { status: "published" })], "published")],
    levels: [level("l1", "draft", "draft")],
    ...over,
  };
}

describe("readiness", () => {
  it("plans everything a draft lesson needs, from its words up to its unit", () => {
    const r = readiness(lesson());
    expect(r.canPublish).toBe(true);
    expect(r.live).toBe(false);
    expect(r.onMap).toBe(true);
    expect(r.plan).toEqual({ clipIds: ["c1"], entryIds: [E1], content: true, levelIds: ["l1"], unitIds: ["u1"] });
    expect(r.silentEntryIds).toEqual([]);
  });

  it("is live once the lesson, one of its levels and that level's unit are published", () => {
    const r = readiness(lesson({ status: "published", entries: [entry(E1, [clip("c1", { status: "published" })], "published"), entry(E2, [], "published")], levels: [level("l1", "published", "published")] }));
    expect(r.live).toBe(true);
    expect(r.plan).toEqual({ clipIds: [], entryIds: [], content: false, levelIds: [], unitIds: [] });
    expect(r.silentEntryIds).toEqual([E2]);
  });

  it("never plans a recording whose speaker has not consented", () => {
    const r = readiness(lesson({ entries: [entry(E1, [clip("c1", { consent: false, isPrimary: true })]), entry(E2, [], "published")] }));
    expect(r.plan.clipIds).toEqual([]);
    expect(r.noConsentClipIds).toEqual(["c1"]);
    expect(r.silentEntryIds).toEqual([E1, E2]);
    expect(r.canPublish).toBe(true);
  });

  it("picks one recording per silent word, the primary one first", () => {
    const r = readiness(lesson({ entries: [entry(E1, [clip("a"), clip("b", { isPrimary: true }), clip("c", { consent: false })]), entry(E2, [clip("d"), clip("e")])] }));
    expect(r.plan.clipIds).toEqual(["b", "d"]);
    expect(r.noConsentClipIds).toEqual([]);
  });

  it("leaves other draft recordings alone when a word can already be heard", () => {
    const r = readiness(lesson({ entries: [entry(E1, [clip("pub", { status: "published" }), clip("spare")], "published"), entry(E2, [], "published")] }));
    expect(r.plan.clipIds).toEqual([]);
  });

  it("blocks publishing while a step is incomplete, empty, or uses a deleted word", () => {
    expect(readiness(lesson({ items: [{ id: "s1", type: "introduce", entryId: "" }] }))).toMatchObject({ canPublish: false, incomplete: 1 });
    expect(readiness(lesson({ items: [] }))).toMatchObject({ canPublish: false, empty: true });
    expect(readiness(lesson({ items: [{ id: "s1", type: "introduce", entryId: GONE }] }))).toMatchObject({ canPublish: false, missingEntryIds: [GONE] });
  });

  it("reports when the lesson is on no level", () => {
    const r = readiness(lesson({ levels: [] }));
    expect(r.onMap).toBe(false);
    expect(r.live).toBe(false);
    expect(r.plan.levelIds).toEqual([]);
  });

  it("lists each draft unit once even when several levels share it", () => {
    const r = readiness(lesson({ levels: [level("l1", "draft", "draft"), level("l2", "published", "draft"), level("l3", "draft", "published", "u2")] }));
    expect(r.plan.levelIds).toEqual(["l1", "l3"]);
    expect(r.plan.unitIds).toEqual(["u1"]);
  });
});

describe("applySelection", () => {
  const plan = { clipIds: ["c1", "c2"], entryIds: [E1], content: true, levelIds: ["l1"], unitIds: ["u1"] };

  it("always keeps the words and the lesson, which publishing requires", () => {
    expect(applySelection(plan, { clipIds: [], levelIds: [], unitIds: [] })).toEqual({ clipIds: [], entryIds: [E1], content: true, levelIds: [], unitIds: [] });
  });

  it("only keeps optional items that were planned", () => {
    expect(applySelection(plan, { clipIds: ["c2", "other"], levelIds: ["l1", "l9"], unitIds: ["u1"] })).toEqual({
      clipIds: ["c2"],
      entryIds: [E1],
      content: true,
      levelIds: ["l1"],
      unitIds: ["u1"],
    });
  });
});

describe("levelBlockers", () => {
  it("says what keeps a level off the map", () => {
    expect(levelBlockers({ type: "lesson", status: "draft", contentStatus: "draft" }, "draft")).toEqual(["level_draft", "content_draft", "unit_draft"]);
    expect(levelBlockers({ type: "quiz", status: "published", contentStatus: null }, "published")).toEqual(["no_content"]);
    expect(levelBlockers({ type: "boss", status: "published", contentStatus: "published" }, "published")).toEqual([]);
  });

  it("does not expect content on review levels", () => {
    expect(levelBlockers({ type: "review", status: "published", contentStatus: null }, "published")).toEqual([]);
  });
});
