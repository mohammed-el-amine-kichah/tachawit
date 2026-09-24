import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./csp";

const parse = (policy: string) =>
  Object.fromEntries(
    policy.split(";").map((part) => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name, values];
    }),
  );

describe("buildContentSecurityPolicy", () => {
  const production = parse(
    buildContentSecurityPolicy({ nonce: "abc123", supabaseUrl: "https://xyz.supabase.co", dev: false }),
  );

  it("only runs scripts carrying this request's nonce", () => {
    expect(production["script-src"]).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
  });

  it("never allows eval in production, but does in development (React's dev tooling needs it)", () => {
    const dev = parse(buildContentSecurityPolicy({ nonce: "n", supabaseUrl: "http://127.0.0.1:54321", dev: true }));
    expect(production["script-src"]).not.toContain("'unsafe-eval'");
    expect(dev["script-src"]).toContain("'unsafe-eval'");
  });

  it("lets audio, images and API calls reach Supabase and nothing else", () => {
    for (const directive of ["media-src", "img-src", "connect-src"]) {
      expect(production[directive]).toContain("https://xyz.supabase.co");
    }
    expect(production["media-src"]).toContain("blob:"); // previewing a recording before sending it
    expect(production["default-src"]).toEqual(["'self'"]);
  });

  it("forbids plugins, framing and foreign base URLs", () => {
    expect(production["object-src"]).toEqual(["'none'"]);
    expect(production["frame-ancestors"]).toEqual(["'none'"]);
    expect(production["base-uri"]).toEqual(["'self'"]);
  });

  it("allows forms to hand off to Supabase for Google sign-in", () => {
    expect(production["form-action"]).toEqual(["'self'", "https://xyz.supabase.co", "https://accounts.google.com"]);
  });

  it("upgrades insecure requests only when Supabase itself is served over HTTPS", () => {
    expect(production["upgrade-insecure-requests"]).toEqual([]);
    const local = parse(buildContentSecurityPolicy({ nonce: "n", supabaseUrl: "http://127.0.0.1:54321", dev: false }));
    expect(local["upgrade-insecure-requests"]).toBeUndefined();
  });

  it("is a single header line", () => {
    expect(buildContentSecurityPolicy({ nonce: "n", supabaseUrl: "https://a.supabase.co", dev: false })).not.toMatch(/\n/);
  });
});
