import { contentKeys } from "@/i18n/config";
import type { LocalizedText } from "@/lib/content/localized-text";
import { toLocalizedForm, type LocalizedFormValue } from "../localized-form";

/** Form value for an optional multilingual field stored in a draft. */
export function formOf(value: unknown): LocalizedFormValue {
  return toLocalizedForm(value && typeof value === "object" ? (value as Partial<LocalizedFormValue>) : null);
}

/** Back to a draft value: only filled languages, or undefined when empty. */
export function draftOf(value: LocalizedFormValue): LocalizedText | undefined {
  const result: LocalizedText = {};
  for (const key of contentKeys) if (value[key].trim()) result[key] = value[key];
  return Object.keys(result).length ? result : undefined;
}
