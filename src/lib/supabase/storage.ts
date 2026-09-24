export type StorageBucket = "audio" | "images";

/** Public URL of a file in one of the public buckets. */
export function getPublicStorageUrl(baseUrl: string, bucket: StorageBucket, path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) throw new Error("Storage path is empty");
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${segments.map(encodeURIComponent).join("/")}`;
}
