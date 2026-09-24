import { describe, expect, it } from "vitest";
import { latinToTifinagh } from "./tifinagh";

describe("latinToTifinagh", () => {
  it("transliterates the seed words", () => {
    expect(latinToTifinagh("azul")).toBe("ⴰⵣⵓⵍ");
    expect(latinToTifinagh("azul fellawen")).toBe("ⴰⵣⵓⵍ ⴼⴻⵍⵍⴰⵡⴻⵏ");
    expect(latinToTifinagh("aɣrum")).toBe("ⴰⵖⵔⵓⵎ");
    expect(latinToTifinagh("tanmirt")).toBe("ⵜⴰⵏⵎⵉⵔⵜ");
  });

  it("covers the emphatic and special Tamazight letters", () => {
    expect(latinToTifinagh("ḍ ḥ ṛ ṣ ṭ ẓ ɛ ε č ǧ x q")).toBe("ⴹ ⵃ ⵕ ⵚ ⵟ ⵥ ⵄ ⵄ ⵞ ⴵ ⵅ ⵇ");
  });

  it("is case-insensitive and leaves punctuation and unknown characters alone", () => {
    expect(latinToTifinagh("Azul!")).toBe("ⴰⵣⵓⵍ!");
    expect(latinToTifinagh("azul-2")).toBe("ⴰⵣⵓⵍ-2");
  });
});
