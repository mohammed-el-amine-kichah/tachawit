import { describe, expect, it } from "vitest";
import { safeNextPath } from "./site-url";

describe("safeNextPath", () => {
  it("accepts paths on this site", () => {
    expect(safeNextPath("/ar/profile", "/")).toBe("/ar/profile");
  });

  it("rejects other sites and malformed values (open redirect protection)", () => {
    expect(safeNextPath("https://evil.example", "/")).toBe("/");
    expect(safeNextPath("//evil.example/path", "/")).toBe("/");
    expect(safeNextPath("/\\evil.example", "/")).toBe("/");
    expect(safeNextPath(undefined, "/fr")).toBe("/fr");
  });
});
