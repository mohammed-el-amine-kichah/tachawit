import { describe, expect, it } from "vitest";
import { callbackForStrayCode, loginForAuthError } from "./code-landing";

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

describe("loginForAuthError", () => {
  it("sends a Supabase sign-in error that landed on a page to the login page, in that page's language", () => {
    const target = loginForAuthError(at("/fr?error=invalid_request&error_code=flow_state_already_used&error_description=x"));
    expect(target?.pathname).toBe("/fr/login");
    expect(target?.searchParams.get("error")).toBe("link");
  });

  it("uses Arabic, the default language, when the page has none", () => {
    expect(loginForAuthError(at("/?error=access_denied&error_code=otp_expired"))?.pathname).toBe("/ar/login");
    expect(loginForAuthError(at("/en/profile?error_code=bad_oauth_state"))?.pathname).toBe("/en/login");
    expect(loginForAuthError(at("/dz/profile?error_code=bad_oauth_state"))?.pathname).toBe("/ar/login");
  });

  it("leaves the login page's own error message and ordinary pages alone", () => {
    expect(loginForAuthError(at("/ar/login?error=link"))).toBeNull();
    expect(loginForAuthError(at("/ar"))).toBeNull();
  });
});
