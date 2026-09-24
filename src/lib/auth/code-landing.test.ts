import { describe, expect, it } from "vitest";
import { callbackForStrayCode } from "./code-landing";

const at = (path: string) => new URL(`https://tachawit.vercel.app${path}`);

describe("callbackForStrayCode", () => {
  it("sends a sign-in code that landed on the home page to the auth callback", () => {
    const target = callbackForStrayCode(at("/?code=abc-123"));
    expect(target?.pathname).toBe("/api/auth/callback");
    expect(target?.searchParams.get("code")).toBe("abc-123");
    expect(target?.searchParams.get("next")).toBe("/");
  });

  it("keeps the page it landed on (and its other parameters) as the place to continue", () => {
    const target = callbackForStrayCode(at("/ar/admin?code=abc&tab=1"));
    expect(target?.searchParams.get("next")).toBe("/ar/admin?tab=1");
  });

  it("leaves ordinary pages alone", () => {
    expect(callbackForStrayCode(at("/ar"))).toBeNull();
    expect(callbackForStrayCode(at("/ar/level/1?level=2"))).toBeNull();
    expect(callbackForStrayCode(at("/ar?code="))).toBeNull();
  });
});
