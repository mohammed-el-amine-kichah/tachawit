const AUDIO_PATH = "/storage/v1/object/public/audio/";

/** Every published audio file referenced by a lesson or quiz view, so it can be kept for offline use. */
export function audioUrlsIn(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node)) {
        if ((key === "url" || key === "slowUrl") && typeof child === "string" && new URL(child, "http://x").pathname.startsWith(AUDIO_PATH)) {
          found.add(child);
        } else {
          visit(child);
        }
      }
    }
  };
  visit(value);
  return [...found];
}
