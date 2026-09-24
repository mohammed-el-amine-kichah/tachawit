import { describe, expect, it } from "vitest";
import { clampTrim, conversionArgs } from "./ffmpeg";

describe("conversionArgs", () => {
  it("trims, normalises loudness and encodes mono AAC for the web", () => {
    const args = conversionArgs({ input: "in.webm", output: "out.m4a", startMs: 250, endMs: 1750, slow: false });
    expect(args.slice(0, 6)).toEqual(["-hide_banner", "-y", "-ss", "0.250", "-to", "1.750"]);
    expect(args).toContain("in.webm");
    expect(args.join(" ")).toContain("loudnorm");
    expect(args.join(" ")).toContain("-c:a aac");
    expect(args.join(" ")).toContain("-ac 1");
    expect(args.at(-1)).toBe("out.m4a");
  });

  it("slows the recording down without changing its pitch", () => {
    expect(conversionArgs({ input: "a", output: "b", startMs: 0, endMs: 1000, slow: true }).join(" ")).toContain("atempo=0.8");
  });
});

describe("clampTrim", () => {
  it("keeps the selection inside the clip and at least 200ms long", () => {
    expect(clampTrim(-50, 5000, 3000)).toEqual({ startMs: 0, endMs: 3000 });
    expect(clampTrim(1000, 1100, 3000)).toEqual({ startMs: 1000, endMs: 1200 });
    expect(clampTrim(2950, 3000, 3000)).toEqual({ startMs: 2800, endMs: 3000 });
  });
});
