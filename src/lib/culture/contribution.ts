import { z } from "zod";

export const contributionKinds = ["word", "variation", "correction", "recording"] as const;
export type ContributionKind = (typeof contributionKinds)[number];

const optionalId = z.union([z.uuid(), z.literal("")]).transform((value) => (value === "" ? null : value));
const optionalText = (max: number) => z.string().max(max).transform((value) => (value.trim() === "" ? null : value));

/** A suggestion from the public, before it becomes a submission row. Tachawit text is kept as typed. */
export const contributionSchema = z
  .object({
    kind: z.enum(contributionKinds),
    text_latin: z.string().max(200),
    text_arabic: optionalText(200),
    text_tifinagh: optionalText(200),
    /** Meaning in the contributor's interface language. */
    meaning: z.string().max(200),
    related_entry_id: optionalId,
    region_id: optionalId,
    village: optionalText(120),
    message: z.string().max(2000),
    contributor_name: optionalText(80),
    contributor_email: z.union([z.email().max(254), z.literal("")]).transform((value) => (value === "" ? null : value)),
    audio_consent: z.boolean(),
    has_audio: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const missing = (path: string) => ctx.addIssue({ code: "custom", path: [path], message: "required" });
    if (value.kind === "word") {
      if (!value.text_latin.trim()) missing("text_latin");
      if (!value.meaning.trim()) missing("meaning");
    }
    if (value.kind === "variation") {
      if (!value.related_entry_id) missing("related_entry_id");
      if (!value.text_latin.trim()) missing("text_latin");
    }
    if (value.kind === "correction" && !value.message.trim()) missing("message");
    if (value.kind === "recording") {
      if (!value.has_audio) missing("audio");
      if (!value.audio_consent) missing("audio_consent");
    }
  });

export type ContributionInput = z.input<typeof contributionSchema>;

type Contributor = { name: string | null; email: string | null };

/**
 * Who a submission is credited to. Signed-in contributors are identified by their account, so a
 * name or email sent from the form is ignored; guests may leave either or both empty.
 */
export function contributorFor(account: { displayName: string | null; email: string | null } | null, form: Contributor): Contributor {
  return account ? { name: account.displayName, email: account.email } : form;
}
