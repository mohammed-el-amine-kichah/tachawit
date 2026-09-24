export function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export function hasUniqueIds(items: readonly { id: string }[]): boolean {
  return hasUniqueValues(items.map((item) => item.id));
}

/** Unique values in order of first appearance. */
export function uniqueInOrder(values: Iterable<string>): string[] {
  return [...new Set(values)];
}
