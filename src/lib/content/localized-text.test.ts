import { describe, expect, it } from "vitest";
import { localizedTextSchema } from "./localized-text";

describe("localizedTextSchema", () => {
  it("accepts any subset of the four UI locales", () => {
    expect(localizedTextSchema.safeParse({ en: "Water" }).success).toBe(true);
    expect(localizedTextSchema.safeParse({ en: "Water", fr: "Eau", ar: "ماء", dz: "الما" }).success).toBe(true);
  });

  it("requires at least one non-blank translation", () => {
    expect(localizedTextSchema.safeParse({}).success).toBe(false);
    expect(localizedTextSchema.safeParse({ en: "  " }).success).toBe(false);
  });

  it("rejects unknown locales so typos surface in the admin", () => {
    expect(localizedTextSchema.safeParse({ en: "Water", es: "Agua" }).success).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(localizedTextSchema.safeParse({ en: 3 }).success).toBe(false);
  });
});
