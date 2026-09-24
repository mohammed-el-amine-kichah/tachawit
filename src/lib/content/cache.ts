/** Tag on every cached content query; revalidate it after publishing from the admin panel. */
export const CONTENT_CACHE_TAG = "content";

/** Upper bound on how long learners may see stale content if a revalidation is missed. */
export const CONTENT_REVALIDATE_SECONDS = 300;
