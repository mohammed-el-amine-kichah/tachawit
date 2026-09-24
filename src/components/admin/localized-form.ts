// Plain helpers for the four-language form fields; usable on the server and in the browser.

export type LocalizedFormValue = { en: string; fr: string; ar: string; dz: string };

export const emptyLocalized: LocalizedFormValue = { en: "", fr: "", ar: "", dz: "" };

export function toLocalizedForm(value: Partial<LocalizedFormValue> | null | undefined): LocalizedFormValue {
  return { ...emptyLocalized, ...(value ?? {}) };
}
