import { describe, expect, it } from "vitest";
import { pickPrompts } from "./prompts";

const id = (n: number) => `30000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const entry = (n: number, translations: unknown = { en: `word ${n}` }) => ({ id: id(n), translations });

describe("pickPrompts", () => {
  it("keeps the entries' order and only their id and meaning", () => {
    expect(pickPrompts([entry(1), entry(2)], [], 10)).toEqual([
      { id: id(1), meaning: { en: "word 1" } },
      { id: id(2), meaning: { en: "word 2" } },
    ]);
  });

  it("leaves out words the speaker already recorded", () => {
    expect(pickPrompts([entry(1), entry(2), entry(3)], [id(2)], 10).map((p) => p.id)).toEqual([id(1), id(3)]);
  });

  it("leaves out entries without a usable meaning", () => {
    expect(pickPrompts([entry(1, {}), entry(2, { en: " " }), entry(3, null), entry(4)], [], 10).map((p) => p.id)).toEqual([id(4)]);
  });

  it("drops meanings in languages the site no longer offers", () => {
    expect(pickPrompts([entry(1, { dz: "old", fr: "eau" })], [], 10)[0].meaning).toEqual({ fr: "eau" });
  });

  it("stops at the limit", () => {
    expect(pickPrompts([entry(1), entry(2), entry(3)], [], 2)).toHaveLength(2);
  });
});
