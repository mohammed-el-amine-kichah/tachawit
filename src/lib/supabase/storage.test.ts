import { describe, expect, it } from "vitest";
import { getPublicStorageUrl } from "./storage";

const base = "http://127.0.0.1:54321";

describe("getPublicStorageUrl", () => {
  it("builds the public object URL for a bucket and path", () => {
    expect(getPublicStorageUrl(base, "audio", "placeholder/azul.m4a")).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/audio/placeholder/azul.m4a",
    );
  });

  it("tolerates a trailing slash on the base URL and a leading slash on the path", () => {
    expect(getPublicStorageUrl(`${base}/`, "images", "/units/cover.webp")).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/images/units/cover.webp",
    );
  });

  it("encodes each path segment but keeps the separators", () => {
    expect(getPublicStorageUrl(base, "audio", "speakers/aɣrum slow.m4a")).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/audio/speakers/a%C9%A3rum%20slow.m4a",
    );
  });

  it("rejects an empty path", () => {
    expect(() => getPublicStorageUrl(base, "audio", "")).toThrow();
    expect(() => getPublicStorageUrl(base, "audio", "/")).toThrow();
  });
});
