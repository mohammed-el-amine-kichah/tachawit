import { isPartOfSpeech, type PartOfSpeech } from "@/lib/content/enums";
import { contentKeys } from "@/i18n/config";
import type { LocalizedText } from "@/lib/content/localized-text";

/** RFC 4180-style CSV: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body.map((cells) => Object.fromEntries(keys.map((key, i) => [key, cells[i] ?? ""])));
}

export type EntryImport = {
  text_latin: string;
  text_arabic: string | null;
  text_tifinagh: string | null;
  translations: LocalizedText;
  part_of_speech: PartOfSpeech | null;
  region_id: string | null;
  notes: string | null;
  status: "draft";
};

export type ImportProblem = "missing_text" | "missing_translation" | "unknown_part_of_speech" | "unknown_region";
export type ImportError = { line: number; problem: ImportProblem };

const blankToNull = (value: string | undefined) => (value && value.trim() !== "" ? value : null);

/**
 * Validates spreadsheet rows (columns: text_latin, text_arabic, text_tifinagh, en, fr, ar,
 * part_of_speech, region, notes). Everything is imported as a draft for review before publishing.
 */
export function rowsToEntries(
  rows: readonly Record<string, string>[],
  regionsBySlug: Readonly<Record<string, string>>,
): { entries: EntryImport[]; errors: ImportError[] } {
  const entries: EntryImport[] = [];
  const errors: ImportError[] = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const translations: LocalizedText = {};
    for (const key of contentKeys) {
      const value = row[key]?.trim();
      if (value) translations[key] = value;
    }
    const part = row.part_of_speech?.trim() ?? "";
    const region = row.region?.trim() ?? "";

    const problem: ImportProblem | null = !row.text_latin?.trim()
      ? "missing_text"
      : Object.keys(translations).length === 0
        ? "missing_translation"
        : part && !isPartOfSpeech(part)
          ? "unknown_part_of_speech"
          : region && !regionsBySlug[region]
            ? "unknown_region"
            : null;
    if (problem) {
      errors.push({ line, problem });
      return;
    }

    entries.push({
      text_latin: row.text_latin,
      text_arabic: blankToNull(row.text_arabic),
      text_tifinagh: blankToNull(row.text_tifinagh),
      translations,
      part_of_speech: isPartOfSpeech(part) ? part : null,
      region_id: region ? regionsBySlug[region] : null,
      notes: blankToNull(row.notes),
      status: "draft",
    });
  });
  return { entries, errors };
}
