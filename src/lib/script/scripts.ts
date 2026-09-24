import type { Direction } from "@/i18n/config";

export const scripts = ["latin", "arabic", "tifinagh"] as const;
export type Script = (typeof scripts)[number];

export const defaultScript: Script = "latin";

/** `shy` is the ISO 639-3 code for Tachawit (Chaoui). */
export const scriptMeta: Record<Script, { dir: Direction; lang: string }> = {
  latin: { dir: "ltr", lang: "shy-Latn" },
  arabic: { dir: "rtl", lang: "shy-Arab" },
  tifinagh: { dir: "ltr", lang: "shy-Tfng" },
};

export function isScript(value: unknown): value is Script {
  return typeof value === "string" && (scripts as readonly string[]).includes(value);
}
