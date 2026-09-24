import { z } from "zod";
import type { LocalizedText } from "@/i18n/localize";

export type { LocalizedText };

/**
 * Multilingual text as stored in the database: any subset of the UI locales, at least one filled.
 * Keys of languages the site no longer offers (Darja's "dz" in older rows) are dropped, not rejected.
 */
export const localizedTextSchema = z
  .object({
    en: z.string().optional(),
    fr: z.string().optional(),
    ar: z.string().optional(),
  })
  .refine((value) => Object.values(value).some((text) => text !== undefined && text.trim() !== ""), {
    message: "At least one translation is required",
  });

/** Validates multilingual JSON coming from the database. */
export function parseLocalizedText(value: unknown): LocalizedText {
  return localizedTextSchema.parse(value);
}
