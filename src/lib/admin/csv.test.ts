import { describe, expect, it } from "vitest";
import { parseCsv, rowsToEntries } from "./csv";

describe("parseCsv", () => {
  it("parses headers and rows", () => {
    expect(parseCsv("a,b\n1,2\n3,4")).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });

  it("handles quotes, escaped quotes, commas and newlines inside quotes", () => {
    expect(parseCsv('text_latin,notes\n"azul","says ""hello"", warmly"\n"x","line 1\nline 2"')).toEqual([
      { text_latin: "azul", notes: 'says "hello", warmly' },
      { text_latin: "x", notes: "line 1\nline 2" },
    ]);
  });

  it("ignores a byte-order mark, Windows line endings and blank lines, and trims headers", () => {
    expect(parseCsv("﻿ text_latin ,en\r\nazul,hello\r\n\r\n")).toEqual([{ text_latin: "azul", en: "hello" }]);
  });

  it("keeps Tachawit text exactly as written", () => {
    expect(parseCsv("text_latin\n aɣrum ")[0].text_latin).toBe(" aɣrum ");
  });
});

describe("rowsToEntries", () => {
  const regions = { merouana: "10000000-0000-4000-8000-000000000001" };

  it("turns valid rows into draft entries", () => {
    const { entries, errors } = rowsToEntries(
      [{ text_latin: "aman", text_arabic: "أمان", en: "water", fr: "eau", part_of_speech: "noun", region: "merouana", notes: "" }],
      regions,
    );
    expect(errors).toEqual([]);
    expect(entries).toEqual([
      {
        text_latin: "aman",
        text_arabic: "أمان",
        text_tifinagh: null,
        translations: { en: "water", fr: "eau" },
        part_of_speech: "noun",
        region_id: regions.merouana,
        notes: null,
        status: "draft",
      },
    ]);
  });

  it("reports problems with the spreadsheet line number", () => {
    const { entries, errors } = rowsToEntries(
      [
        { text_latin: "", en: "nothing" },
        { text_latin: "aman" },
        { text_latin: "adrar", en: "mountain", part_of_speech: "mountainous" },
        { text_latin: "tala", en: "spring", region: "atlantis" },
      ],
      regions,
    );
    expect(entries).toEqual([]);
    expect(errors.map((e) => [e.line, e.problem])).toEqual([
      [2, "missing_text"],
      [3, "missing_translation"],
      [4, "unknown_part_of_speech"],
      [5, "unknown_region"],
    ]);
  });
});
