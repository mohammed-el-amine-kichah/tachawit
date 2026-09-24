import { describe, expect, it } from "vitest";
import { defaultUnlockRule, mapPositionSchema, unlockRuleSchema } from "./unlock-rule";

const levelId = "6f1c1a52-8a0e-4c55-9d1a-0c3f9a1b2c3d";

describe("unlockRuleSchema", () => {
  it("defaults to 'previous level completed'", () => {
    expect(defaultUnlockRule).toEqual({ type: "previous_completed" });
    expect(unlockRuleSchema.parse(defaultUnlockRule)).toEqual(defaultUnlockRule);
  });

  it("accepts the supported rule types", () => {
    expect(unlockRuleSchema.safeParse({ type: "always" }).success).toBe(true);
    expect(unlockRuleSchema.safeParse({ type: "levels_completed", levelIds: [levelId] }).success).toBe(true);
    expect(unlockRuleSchema.safeParse({ type: "unit_stars", minStars: 6 }).success).toBe(true);
  });

  it("rejects an unknown rule type", () => {
    expect(unlockRuleSchema.safeParse({ type: "pay_to_unlock" }).success).toBe(false);
  });

  it("requires at least one level for levels_completed", () => {
    expect(unlockRuleSchema.safeParse({ type: "levels_completed", levelIds: [] }).success).toBe(false);
  });

  it("requires a positive whole number of stars", () => {
    expect(unlockRuleSchema.safeParse({ type: "unit_stars", minStars: 0 }).success).toBe(false);
    expect(unlockRuleSchema.safeParse({ type: "unit_stars", minStars: 1.5 }).success).toBe(false);
  });
});

describe("mapPositionSchema", () => {
  it("accepts normalised coordinates between 0 and 1", () => {
    expect(mapPositionSchema.safeParse({ x: 0, y: 1 }).success).toBe(true);
    expect(mapPositionSchema.safeParse({ x: 0.42, y: 0.1 }).success).toBe(true);
  });

  it("rejects coordinates outside the map", () => {
    expect(mapPositionSchema.safeParse({ x: -0.1, y: 0.5 }).success).toBe(false);
    expect(mapPositionSchema.safeParse({ x: 0.5, y: 1.2 }).success).toBe(false);
  });
});
