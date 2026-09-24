/** Narrows an untrusted string (cookie, query param) to one of the allowed values. */
export function parseChoice<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return (allowed as readonly string[]).includes(value ?? "") ? (value as T) : fallback;
}
