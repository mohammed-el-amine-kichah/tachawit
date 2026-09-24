import { describe, expect, it } from "vitest";
import { sitemapEntries } from "./sitemap";

describe("sitemapEntries", () => {
  const entries = sitemapEntries("https://tachawit.app", ["yennayer"]);
  const urls = entries.map((entry) => entry.url);

  it("lists the public pages in Arabic (the default language)", () => {
    expect(urls).toEqual([
      "https://tachawit.app/ar",
      "https://tachawit.app/ar/culture",
      "https://tachawit.app/ar/about",
      "https://tachawit.app/ar/contribute",
      "https://tachawit.app/ar/culture/yennayer",
    ]);
  });

  it("points search engines to every language", () => {
    expect(entries[4].alternates?.languages).toEqual({
      en: "https://tachawit.app/en/culture/yennayer",
      fr: "https://tachawit.app/fr/culture/yennayer",
      ar: "https://tachawit.app/ar/culture/yennayer",
      "x-default": "https://tachawit.app/ar/culture/yennayer",
    });
  });

  it("never includes learner, player or admin pages", () => {
    expect(urls.some((url) => /profile|admin|level|review|login/.test(url))).toBe(false);
  });
});
