const ONE_YEAR = 60 * 60 * 24 * 365;

/** Persists a small UI preference so the server can render it on the next request. */
export function writePreferenceCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}
