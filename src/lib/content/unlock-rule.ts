import { z } from "zod";

export const unlockRuleSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("previous_completed") }),
  z.strictObject({ type: z.literal("always") }),
  z.strictObject({ type: z.literal("levels_completed"), levelIds: z.array(z.uuid()).min(1) }),
  z.strictObject({ type: z.literal("unit_stars"), minStars: z.int().positive() }),
]);

export type UnlockRule = z.infer<typeof unlockRuleSchema>;

export const defaultUnlockRule: UnlockRule = { type: "previous_completed" };

/** Node position on a unit map, normalised to 0..1 so it scales with any map size. */
export const mapPositionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export type MapPosition = z.infer<typeof mapPositionSchema>;
