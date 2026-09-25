"use client";

import { CheckIcon, LoaderIcon } from "lucide-react";
import { useTranslations } from "next-intl";

/** "saving" is in flight; "pending" autosaves shortly; "unsaved" waits for an explicit save. */
export type SaveState = "saving" | "saved" | "pending" | "unsaved";

export function SaveIndicator({ state }: { state: SaveState | null }) {
  const t = useTranslations("Admin.editor");
  return (
    <span aria-live="polite" className="flex items-center gap-1 text-sm text-muted-foreground">
      {state === "saving" && (
        <>
          <LoaderIcon aria-hidden className="size-4 animate-spin" /> {t("saving")}
        </>
      )}
      {state === "saved" && (
        <>
          <CheckIcon aria-hidden className="size-4" /> {t("allSaved")}
        </>
      )}
      {state === "pending" && t("autosaving")}
      {state === "unsaved" && t("unsaved")}
    </span>
  );
}
