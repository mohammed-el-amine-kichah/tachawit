import { describe, expect, it } from "vitest";
import { defaultScripts, readScripts, toggleScript } from "./scripts";

describe("readScripts", () => {
  it("reads the scripts a speaker chose, in a fixed order", () => {
    expect(readScripts(["tifinagh", "latin"])).toEqual(["latin", "tifinagh"]);
  });

  it("falls back to the default for anything else", () => {
    expect(readScripts(null)).toEqual(defaultScripts);
    expect(readScripts("latin")).toEqual(defaultScripts);
    expect(readScripts(["klingon"])).toEqual(defaultScripts);
  });

  it("allows choosing none: writing is optional", () => {
    expect(readScripts([])).toEqual([]);
  });
});

describe("toggleScript", () => {
  it("adds or removes a script and keeps the order", () => {
    expect(toggleScript(["latin"], "arabic")).toEqual(["latin", "arabic"]);
    expect(toggleScript(["latin", "arabic"], "latin")).toEqual(["arabic"]);
    expect(toggleScript(["tifinagh"], "latin")).toEqual(["latin", "tifinagh"]);
  });
});
