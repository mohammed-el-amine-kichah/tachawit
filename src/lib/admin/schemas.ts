import { z } from "zod";
import { partsOfSpeech } from "@/lib/content/enums";
import type { LocalizedText } from "@/lib/content/localized-text";

// Form payloads shared by the admin UI and its server actions. Tachawit text is kept exactly as
// typed; blank optional fields become null.

const blankToNull = z.string().transform((value) => (value.trim() === "" ? null : value));

/** The four translation inputs of a form, keeping only the filled ones. */
export const localizedFormSchema = z
  .object({ en: z.string(), fr: z.string(), ar: z.string(), dz: z.string() })
  .transform((value) => {
    const result: LocalizedText = {};
    for (const key of ["en", "fr", "ar", "dz"] as const) if (value[key].trim()) result[key] = value[key].trim();
    return result;
  });

const requiredLocalized = localizedFormSchema.refine((value) => Object.keys(value).length > 0, { message: "at_least_one" });

export const entryFormSchema = z.object({
  text_latin: z.string().refine((value) => value.trim() !== "", { message: "required" }),
  text_arabic: blankToNull,
  text_tifinagh: blankToNull,
  translations: requiredLocalized,
  part_of_speech: z.union([z.enum(partsOfSpeech), z.literal("")]).transform((value) => (value === "" ? null : value)),
  region_id: z.union([z.uuid(), z.literal("")]).transform((value) => (value === "" ? null : value)),
  notes: blankToNull,
  image_path: blankToNull,
});

export type EntryFormInput = z.input<typeof entryFormSchema>;
export type EntryFormValues = z.output<typeof entryFormSchema>;

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function tomorrow(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const speakerFormSchema = z
  .object({
    display_name: z.string().trim().min(1).max(80),
    region_id: z.union([z.uuid(), z.literal("")]).transform((value) => (value === "" ? null : value)),
    village: blankToNull,
    consent_given: z.boolean(),
    consent_date: z.union([z.string().regex(isoDate), z.literal("")]).transform((value) => (value === "" ? null : value)),
    bio: localizedFormSchema,
  })
  .superRefine((value, ctx) => {
    if (value.consent_given && !value.consent_date) ctx.addIssue({ code: "custom", path: ["consent_date"], message: "required" });
    if (value.consent_date && value.consent_date > tomorrow()) ctx.addIssue({ code: "custom", path: ["consent_date"], message: "future" });
  })
  .transform(({ bio, ...rest }) => ({ ...rest, public_bio: Object.keys(bio).length ? bio : null }));

export type SpeakerFormInput = z.input<typeof speakerFormSchema>;

export const regionFormSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: requiredLocalized,
});

export type RegionFormInput = z.input<typeof regionFormSchema>;
