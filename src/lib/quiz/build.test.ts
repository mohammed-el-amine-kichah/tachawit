import { describe, expect, it } from "vitest";
import { buildBlank, buildQuizItems, buildTiles } from "./build";
import { id, viewEntry } from "./fixtures";

const entries = Object.fromEntries(
  [
    viewEntry(1, "azul", { arabic: "أزول" }),
    viewEntry(2, "azul fellawen", { arabic: "أزول فلاون" }),
    viewEntry(3, "tanmirt"),
    viewEntry(4, "aman"),
    viewEntry(5, "adrar", { noAudio: true }),
  ].map((e) => [e.id, e]),
);

describe("buildQuizItems", () => {
  it("keeps question order and puts the answer among shuffled options", () => {
    const [item] = buildQuizItems(
      [{ id: "q1", type: "listen_pick_translation", entryId: id(1), distractorEntryIds: [id(3), id(4)] }],
      entries,
      42,
    );
    expect(item.type).toBe("listen_pick_translation");
    if (item.type !== "listen_pick_translation") return;
    expect(item.options.map((o) => o.id).sort()).toEqual([id(1), id(3), id(4)].sort());
    expect(item.answer.id).toBe(id(1));
  });

  it("shuffles the same way for the same seed", () => {
    const q = [{ id: "q1", type: "match_pairs" as const, entryIds: [id(1), id(2), id(3), id(4)] }];
    expect(buildQuizItems(q, entries, 7)).toEqual(buildQuizItems(q, entries, 7));
  });

  it("drops questions whose answer entry is missing", () => {
    const items = buildQuizItems([{ id: "q1", type: "speak", entryId: "90000000-0000-4000-8000-000000000000" }], entries, 1);
    expect(items).toEqual([]);
  });

  it("drops distractors that are missing and questions left with no choice", () => {
    const items = buildQuizItems(
      [{ id: "q1", type: "listen_pick_translation", entryId: id(1), distractorEntryIds: ["90000000-0000-4000-8000-000000000000"] }],
      entries,
      1,
    );
    expect(items).toEqual([]);
  });

  it("needs audio for listening questions and for every audio option", () => {
    const items = buildQuizItems(
      [
        { id: "q1", type: "listen_pick_translation", entryId: id(5), distractorEntryIds: [id(1)] },
        { id: "q2", type: "pick_audio", entryId: id(1), distractorEntryIds: [id(5), id(3)] },
      ],
      entries,
      1,
    );
    expect(items.map((i) => i.id)).toEqual(["q2"]);
    const q2 = items[0];
    expect(q2.type === "pick_audio" && q2.options.map((o) => o.id).sort()).toEqual([id(1), id(3)].sort());
  });

  it("keeps only match pairs that have audio, and needs at least two", () => {
    const [item] = buildQuizItems([{ id: "q1", type: "match_pairs", entryIds: [id(1), id(5), id(3)] }], entries, 3);
    expect(item.type === "match_pairs" && item.pairs.map((p) => p.id).sort()).toEqual([id(1), id(3)].sort());
    expect(buildQuizItems([{ id: "q1", type: "match_pairs", entryIds: [id(1), id(5)] }], entries, 3)).toEqual([]);
  });
});

describe("buildTiles", () => {
  it("offers the words of the answer plus distractor words, in the chosen script", () => {
    const { answer, tiles } = buildTiles(entries[id(2)], [entries[id(3)]], "arabic", 5);
    expect(answer).toEqual(["أزول", "فلاون"]);
    expect(tiles.map((t) => t.text).sort()).toEqual(["tanmirt", "أزول", "فلاون"].sort());
    expect(new Set(tiles.map((t) => t.id)).size).toBe(3);
  });

  it("does not offer a distractor word that is also in the answer", () => {
    const { tiles } = buildTiles(entries[id(2)], [entries[id(1)]], "latin", 5);
    expect(tiles.map((t) => t.text).sort()).toEqual(["azul", "fellawen"]);
  });
});

describe("buildBlank", () => {
  it("hides the chosen word and offers it among distractor words", () => {
    const blank = buildBlank(entries[id(2)], 1, [entries[id(3)], entries[id(4)]], "latin", 9);
    expect(blank).not.toBeNull();
    expect(blank?.before).toEqual(["azul"]);
    expect(blank?.after).toEqual([]);
    expect(blank?.answer).toBe("fellawen");
    expect(blank?.options.sort()).toEqual(["aman", "fellawen", "tanmirt"]);
  });

  it("falls back to Latin when the chosen script has a different word count", () => {
    const withShortArabic = { ...entries[id(2)], text_arabic: "أزولفلاون" };
    expect(buildBlank(withShortArabic, 1, [entries[id(3)]], "arabic", 1)?.answer).toBe("fellawen");
  });

  it("returns null when the blank is outside the phrase", () => {
    expect(buildBlank(entries[id(1)], 3, [entries[id(3)]], "latin", 1)).toBeNull();
  });
});
