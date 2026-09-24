// Small validators for data read back from localStorage. The learner app avoids Zod here so its
// runtime (tens of kilobytes) is not shipped on every page; each reader returns a clean copy with
// only the known fields, or null.

export type Reader<T> = (value: unknown) => T | null;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const readInt = (value: unknown, min = -Infinity, max = Infinity): number | null =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max ? (value as number) : null;

export const readNumber = (value: unknown, min = -Infinity): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= min ? value : null;

export const readString = (value: unknown): string | null => (typeof value === "string" ? value : null);

/** A string or null; `undefined` (the field is missing or not a string/null) means invalid. */
export const readNullableString = (value: unknown): string | null | undefined =>
  value === null ? null : typeof value === "string" ? value : undefined;

/** Every value of an object read with `read`; null if any is invalid. */
export function readRecord<T>(value: unknown, read: Reader<T>): Record<string, T> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, T> = {};
  for (const [key, item] of Object.entries(value)) {
    const parsed = read(item);
    if (parsed === null) return null;
    out[key] = parsed;
  }
  return out;
}

/** Every item of an array read with `read`; null if any is invalid. */
export function readArray<T>(value: unknown, read: Reader<T>): T[] | null {
  if (!Array.isArray(value)) return null;
  const out: T[] = [];
  for (const item of value) {
    const parsed = read(item);
    if (parsed === null) return null;
    out.push(parsed);
  }
  return out;
}
