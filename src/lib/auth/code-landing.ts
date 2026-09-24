import { defaultLocale, isLocale } from "@/i18n/config";

/**
 * Supabase sends people to the project's Site URL instead of the auth callback when the callback
 * isn't in its Redirect URLs allow-list, with the sign-in `?code=` on whatever page that is. This
 * finds such a code and points it at the callback so the session is still created, continuing on
 * the page it landed on. Null for every ordinary request.
 */
export function callbackForStrayCode(url: URL): URL | null {
  const code = url.searchParams.get("code");
  if (!code) return null;

  const rest = new URLSearchParams(url.searchParams);
  rest.delete("code");
  const query = rest.toString();

  const target = new URL("/api/auth/callback", url.origin);
  target.searchParams.set("code", code);
  target.searchParams.set("next", `${url.pathname}${query ? `?${query}` : ""}`);
  return target;
}

/**
 * The same fallback can carry an error instead (an expired link, a sign-in finished twice). Supabase
 * always adds `error_code`, which tells it apart from the login page's own `?error=` message. Sends
 * the visitor to the login page, in the language of the page it landed on, to try again.
 */
export function loginForAuthError(url: URL): URL | null {
  if (!url.searchParams.get("error_code")) return null;
  const first = url.pathname.split("/")[1];
  const target = new URL(`/${isLocale(first) ? first : defaultLocale}/login`, url.origin);
  target.searchParams.set("error", "link");
  return target;
}
