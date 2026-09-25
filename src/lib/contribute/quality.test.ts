import { describe, expect, it } from "vitest";
import { checkRecording } from "./quality";

const RATE = 8000;
const tone = (seconds: number, amplitude: number) =>
  Float32Array.from({ length: Math.round(seconds * RATE) }, (_, i) => amplitude * Math.sin((2 * Math.PI * 220 * i) / RATE));

describe("checkRecording", () => {
  it("passes a clear recording", () => {
    expect(checkRecording(tone(1.2, 0.5), RATE)).toBeNull();
  });

  it("flags a recording that is too short", () => {
    expect(checkRecording(tone(0.2, 0.5), RATE)).toBe("too_short");
  });

  it("flags a silent recording", () => {
    expect(checkRecording(tone(1.2, 0.005), RATE)).toBe("silent");
    expect(checkRecording(new Float32Array(RATE), RATE)).toBe("silent");
  });

  it("flags a recording that is too loud", () => {
    const loud = tone(1.2, 1.4).map((s) => Math.max(-1, Math.min(1, s)));
    expect(checkRecording(loud, RATE)).toBe("too_loud");
  });

  it("allows a few loud peaks", () => {
    const samples = tone(1.2, 0.5);
    samples[100] = 1;
    samples[200] = -1;
    expect(checkRecording(samples, RATE)).toBeNull();
  });
});
