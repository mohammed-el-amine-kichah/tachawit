import { describe, expect, it } from "vitest";
import { sameSequence } from "./check";

describe("sameSequence", () => {
  it("accepts the words in the right order only", () => {
    expect(sameSequence(["azul", "fellawen"], ["azul", "fellawen"])).toBe(true);
    expect(sameSequence(["fellawen", "azul"], ["azul", "fellawen"])).toBe(false);
    expect(sameSequence(["azul"], ["azul", "fellawen"])).toBe(false);
  });

  it("ignores case and surrounding punctuation", () => {
    expect(sameSequence(["Azul,", "fellawen!"], ["azul", "fellawen"])).toBe(true);
  });
});
