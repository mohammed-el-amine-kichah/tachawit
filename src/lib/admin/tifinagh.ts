// Latin → Tifinagh (Neo-Tifinagh, IRCAM letters), offered as a suggestion in the entry editor.
// The admin always reviews it; nothing is ever converted silently.

const LETTERS: Record<string, string> = {
  a: "ⴰ", b: "ⴱ", c: "ⵛ", č: "ⵞ", d: "ⴷ", ḍ: "ⴹ", e: "ⴻ", ɛ: "ⵄ", ε: "ⵄ", f: "ⴼ", g: "ⴳ", ǧ: "ⴵ", ɣ: "ⵖ",
  h: "ⵀ", ḥ: "ⵃ", i: "ⵉ", j: "ⵊ", k: "ⴽ", l: "ⵍ", m: "ⵎ", n: "ⵏ", o: "ⵓ", p: "ⵒ", q: "ⵇ", r: "ⵔ", ṛ: "ⵕ",
  s: "ⵙ", ṣ: "ⵚ", t: "ⵜ", ṭ: "ⵟ", u: "ⵓ", v: "ⵠ", w: "ⵡ", x: "ⵅ", y: "ⵢ", z: "ⵣ", ẓ: "ⵥ", ʷ: "ⵯ",
};

export function latinToTifinagh(latin: string): string {
  return [...latin.normalize("NFC").toLocaleLowerCase()].map((char) => LETTERS[char] ?? char).join("");
}
