import { z } from "zod";

/**
 * A member's own speaker profile. The consent date is not sent: the database sets it on the day
 * consent is given and clears it when consent is withdrawn.
 */
export const speakerProfileSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  region_id: z.union([z.uuid(), z.literal("")]).transform((value) => (value === "" ? null : value)),
  village: z
    .string()
    .max(120)
    .transform((value) => (value.trim() === "" ? null : value.trim())),
  consent_given: z.boolean(),
});

export type SpeakerProfileInput = z.input<typeof speakerProfileSchema>;
