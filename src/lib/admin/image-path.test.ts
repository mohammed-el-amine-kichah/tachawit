import { describe, expect, it } from "vitest";
import { imagePathSchema } from "./image-path";

const uuid = "5445d329-74f0-4f19-b307-906a2371e0e5";

describe("imagePathSchema", () => {
  it("accepts an image uploaded to the expected folder, or null to remove it", () => {
    expect(imagePathSchema("culture").parse(`culture/${uuid}.png`)).toBe(`culture/${uuid}.png`);
    expect(imagePathSchema("units").parse(`units/${uuid}.webp`)).toBe(`units/${uuid}.webp`);
    expect(imagePathSchema("culture").parse(null)).toBeNull();
  });

  it("rejects paths outside the folder, other file types and path tricks", () => {
    for (const path of [`units/${uuid}.png`, `culture/${uuid}.svg`, `culture/../audio/${uuid}.png`, "culture/x.png", `https://evil.test/${uuid}.png`, ""]) {
      expect(imagePathSchema("culture").safeParse(path).success, path).toBe(false);
    }
  });
});
