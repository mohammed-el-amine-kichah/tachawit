import { parseChoice } from "@/lib/choice";

export const themes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];

export const THEME_COOKIE = "tachawit-theme";

export function parseThemePreference(value: string | null | undefined): Theme {
  return parseChoice(value, themes, "system");
}
