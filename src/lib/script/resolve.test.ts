import { describe, expect, it } from "vitest";
import { resolveTachawitText } from "./resolve";

const full = {
  text_latin: "azul",
  text_arabic: "أزول",
  text_tifinagh: "ⴰⵣⵓⵍ",
};

describe("resolveTachawitText", () => {
  it("returns the requested script when it exists", () => {
    expect(resolveTachawitText(full, "tifinagh")).toEqual({
      text: "ⴰⵣⵓⵍ",
      script: "tifinagh",
      requested: "tifinagh",
      isFallback: false,
      dir: "ltr",
      lang: "shy-Tfng",
    });
  });

  it("renders Arabic script right-to-left with the Arabic-script language tag", () => {
    const resolved = resolveTachawitText(full, "arabic");
    expect(resolved.text).toBe("أزول");
    expect(resolved.dir).toBe("rtl");
    expect(resolved.lang).toBe("shy-Arab");
  });

  it("falls back to Latin when the requested script is missing", () => {
    const resolved = resolveTachawitText({ text_latin: "aɣrum", text_arabic: null }, "arabic");
    expect(resolved).toMatchObject({
      text: "aɣrum",
      script: "latin",
      requested: "arabic",
      isFallback: true,
      dir: "ltr",
      lang: "shy-Latn",
    });
  });

  it("falls back to Latin when the requested script is blank", () => {
    const resolved = resolveTachawitText({ ...full, text_tifinagh: "  " }, "tifinagh");
    expect(resolved.script).toBe("latin");
    expect(resolved.isFallback).toBe(true);
  });

  it("keeps Tamazight Latin characters exactly as stored", () => {
    const text = "ɣ ḥ ṭ ḍ ṣ ẓ ɛ ε č ǧ";
    expect(resolveTachawitText({ text_latin: text }, "latin").text).toBe(text);
  });
});
