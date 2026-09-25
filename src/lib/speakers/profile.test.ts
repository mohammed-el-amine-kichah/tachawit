import { describe, expect, it } from "vitest";
import { speakerProfileSchema } from "./profile";

const base = { display_name: "Yamina", region_id: "", village: " Menaa ", consent_given: true };

describe("speakerProfileSchema", () => {
  it("accepts a profile and tidies optional fields", () => {
    expect(speakerProfileSchema.parse(base)).toEqual({ display_name: "Yamina", region_id: null, village: "Menaa", consent_given: true });
    expect(speakerProfileSchema.parse({ ...base, village: "  " }).village).toBeNull();
  });

  it("needs a name and a valid region", () => {
    expect(speakerProfileSchema.safeParse({ ...base, display_name: "  " }).success).toBe(false);
    expect(speakerProfileSchema.safeParse({ ...base, region_id: "batna" }).success).toBe(false);
  });

  it("never takes a consent date from the client", () => {
    expect(speakerProfileSchema.parse({ ...base, consent_date: "2000-01-01" })).not.toHaveProperty("consent_date");
  });
});
