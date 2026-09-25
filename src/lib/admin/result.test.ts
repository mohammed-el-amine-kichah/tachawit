import { describe, expect, it } from "vitest";
import { adminError } from "./result";

describe("adminError", () => {
  it("recognises the database's publish and consent guards", () => {
    expect(adminError({ code: "23514", message: "Cannot publish audio: the speaker has no recorded consent" })).toBe("consent_required");
    expect(adminError({ code: "23514", message: "Entry x is used by a published lesson or quiz; unpublish that first" })).toBe("in_use");
    expect(adminError({ code: "23514", message: "Cannot publish level: its lesson or quiz is still a draft" })).toBe("content_draft");
    expect(adminError({ code: "23514", message: "Cannot publish: entry 3000 is missing or still a draft" })).toBe("entries_draft");
    expect(adminError({ code: "23514", message: "This is used by a published level; unpublish the level first" })).toBe("in_use");
  });

  it("maps permissions, duplicates and references", () => {
    expect(adminError({ code: "42501" })).toBe("forbidden");
    expect(adminError({ code: "23505" })).toBe("duplicate");
    expect(adminError({ code: "23503" })).toBe("in_use");
    expect(adminError({ code: "XX000" })).toBe("failed");
  });
});
