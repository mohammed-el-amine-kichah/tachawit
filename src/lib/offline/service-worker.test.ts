import { beforeAll, describe, expect, it } from "vitest";

type Rules = {
  routeFor(url: URL, request: { method: string; mode: string }, origin: string): "static" | "audio" | "page" | null;
  isKeptPage(pathname: string): boolean;
  offlinePathFor(pathname: string): string;
  parseRange(header: string | null, size: number): { start: number; end: number } | null;
  OFFLINE_PATHS: string[];
};

let rules: Rules;

beforeAll(async () => {
  // The worker is plain JavaScript served from /public; outside a worker it only exposes its rules.
  await import(/* @vite-ignore */ new URL("../../../public/sw.js", import.meta.url).href);
  rules = (globalThis as unknown as { TachawitServiceWorker: Rules }).TachawitServiceWorker;
});

const origin = "https://tachawit.app";
const get = { method: "GET", mode: "cors" };
const navigate = { method: "GET", mode: "navigate" };

describe("routeFor", () => {
  it("serves build assets and icons from the cache first", () => {
    expect(rules.routeFor(new URL(`${origin}/_next/static/chunks/app.js`), get, origin)).toBe("static");
    expect(rules.routeFor(new URL(`${origin}/icons/icon-192.png`), get, origin)).toBe("static");
    expect(rules.routeFor(new URL(`${origin}/manifest.webmanifest`), get, origin)).toBe("static");
  });

  it("keeps published audio clips, wherever Supabase is hosted", () => {
    const clip = new URL("https://xyz.supabase.co/storage/v1/object/public/audio/placeholder/azul.mp3");
    expect(rules.routeFor(clip, get, origin)).toBe("audio");
    const other = new URL("https://xyz.supabase.co/storage/v1/object/public/images/a.png");
    expect(rules.routeFor(other, get, origin)).toBeNull();
  });

  it("handles page navigations on this site, but never admin, API or sign-in pages", () => {
    expect(rules.routeFor(new URL(`${origin}/ar/level/abc`), navigate, origin)).toBe("page");
    expect(rules.routeFor(new URL(`${origin}/en/admin/entries`), navigate, origin)).toBeNull();
    expect(rules.routeFor(new URL(`${origin}/api/auth/callback`), navigate, origin)).toBeNull();
    expect(rules.routeFor(new URL(`${origin}/fr/login`), navigate, origin)).toBeNull();
    expect(rules.routeFor(new URL("https://elsewhere.test/ar"), navigate, origin)).toBeNull();
  });

  it("leaves writes and data requests to the network", () => {
    expect(rules.routeFor(new URL(`${origin}/ar/level/abc`), { method: "POST", mode: "cors" }, origin)).toBeNull();
    expect(rules.routeFor(new URL(`${origin}/ar/level/abc`), get, origin)).toBeNull();
  });
});

describe("isKeptPage", () => {
  it("keeps the map, opened levels, review and the offline page in every language", () => {
    for (const path of ["/ar", "/fr", "/en/level/0b1c", "/fr/review", "/ar/offline"]) {
      expect(rules.isKeptPage(path), path).toBe(true);
    }
  });

  it("does not keep personal or unrelated pages", () => {
    for (const path of ["/ar/profile", "/en/admin", "/ar/culture", "/xx", "/"]) {
      expect(rules.isKeptPage(path), path).toBe(false);
    }
  });
});

describe("offlinePathFor", () => {
  it("answers in the language of the page that failed, Arabic by default", () => {
    expect(rules.offlinePathFor("/fr/level/1")).toBe("/fr/offline");
    expect(rules.offlinePathFor("/en")).toBe("/en/offline");
    expect(rules.offlinePathFor("/dz")).toBe("/ar/offline");
    expect(rules.offlinePathFor("/something")).toBe("/ar/offline");
  });

  it("precaches one offline page per language", () => {
    expect(rules.OFFLINE_PATHS.sort()).toEqual(["/ar/offline", "/en/offline", "/fr/offline"]);
  });
});

describe("parseRange", () => {
  it("reads the byte ranges browsers send for audio", () => {
    expect(rules.parseRange("bytes=0-", 1000)).toEqual({ start: 0, end: 999 });
    expect(rules.parseRange("bytes=100-199", 1000)).toEqual({ start: 100, end: 199 });
    expect(rules.parseRange("bytes=-100", 1000)).toEqual({ start: 900, end: 999 });
  });

  it("clamps the end to the file and rejects impossible ranges", () => {
    expect(rules.parseRange("bytes=500-5000", 1000)).toEqual({ start: 500, end: 999 });
    expect(rules.parseRange("bytes=2000-", 1000)).toBeNull();
    expect(rules.parseRange("items=0-1", 1000)).toBeNull();
    expect(rules.parseRange(null, 1000)).toBeNull();
  });
});
