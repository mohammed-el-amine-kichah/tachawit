// Plain helpers for the multilingual form fields; usable on the server and in the browser.

export type LocalizedFormValue = { en: string; fr: string; ar: string };

export const emptyLocalized: LocalizedFormValue = { en: "", fr: "", ar: "" };

export function toLocalizedForm(value: Partial<LocalizedFormValue> | null | undefined): LocalizedFormValue {
  return { en: value?.en ?? "", fr: value?.fr ?? "", ar: value?.ar ?? "" };
}
