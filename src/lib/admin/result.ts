/** What every admin action returns: success (with an optional id) or a translatable error key. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { id?: string } : { data: T }))
  | { ok: false; error: AdminError };

export type AdminError =
  | "forbidden"
  | "invalid"
  | "not_found"
  | "consent_required"
  | "in_use"
  | "content_draft"
  | "entries_draft"
  | "has_audio"
  | "duplicate"
  | "failed";

type PostgrestLikeError = { code?: string; message?: string } | null | undefined;

/** Maps database errors (including the publish and consent guards) to admin error keys. */
export function adminError(error: PostgrestLikeError, context: "audio" | "entry" | "speaker" | "content" = "content"): AdminError {
  if (!error) return "failed";
  if (error.code === "42501") return "forbidden";
  if (error.code === "23505") return "duplicate";
  if (error.code === "23503") return context === "speaker" ? "has_audio" : "in_use";
  if (error.code === "23514") {
    if (error.message?.includes("consent")) return "consent_required";
    if (error.message?.includes("used by")) return "in_use";
    if (error.message?.includes("still a draft")) return error.message.includes("entry") ? "entries_draft" : "content_draft";
    return "invalid";
  }
  return "failed";
}
