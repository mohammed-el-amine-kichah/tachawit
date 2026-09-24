"use client";

import { useTranslations } from "next-intl";
import { IntroduceStep } from "@/components/lesson/introduce-step";
import { ScriptToggle } from "@/components/shared/script-toggle";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { AudioInfo, ViewEntry } from "@/lib/lesson/view";

/** The entry exactly as learners will see it in a lesson, updated as you type. */
export function EntryPreview({ entry, audio }: { entry: ViewEntry; audio: AudioInfo | null }) {
  const t = useTranslations("Admin.entries");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-muted-foreground">{t("preview")}</p>
        <ScriptToggle />
      </div>
      <div className="rounded-[2rem] border-8 border-muted bg-background p-5 shadow-raised">
        {entry.text_latin.trim() ? (
          <IntroduceStep entry={entry} audio={audio} autoPlay={false} />
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("previewEmpty")}</p>
        )}
      </div>
    </div>
  );
}

export function previewTranslations(values: Record<"en" | "fr" | "ar" | "dz", string>): LocalizedText {
  return Object.fromEntries(Object.entries(values).filter(([, text]) => text.trim())) as LocalizedText;
}
