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
