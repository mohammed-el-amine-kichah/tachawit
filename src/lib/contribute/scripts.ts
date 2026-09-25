// The scripts a speaker writes in next to a recording. Remembered on their device.

export const writingScripts = ["latin", "arabic", "tifinagh"] as const;
export type WritingScript = (typeof writingScripts)[number];

export const defaultScripts: WritingScript[] = ["latin"];

const inOrder = (scripts: ReadonlySet<string>) => writingScripts.filter((s) => scripts.has(s));

export function readScripts(value: unknown): WritingScript[] {
  if (!Array.isArray(value)) return defaultScripts;
  const known = value.filter((s): s is WritingScript => (writingScripts as readonly unknown[]).includes(s));
  return known.length === value.length ? inOrder(new Set(known)) : defaultScripts;
}

export function toggleScript(scripts: readonly WritingScript[], script: WritingScript): WritingScript[] {
  const next = new Set<string>(scripts);
  if (next.has(script)) next.delete(script);
  else next.add(script);
  return inOrder(next);
}
