"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { localize } from "@/i18n/localize";
import type { RecordingPrompt } from "@/lib/contribute/prompts";

/** The word to record, shown by its meaning so the speaker says it their own way. */
export function PromptCard({ prompt, position, total, onSkip }: { prompt: RecordingPrompt; position: number; total: number; onSkip: () => void }) {
  const t = useTranslations("Contribute");
  const meaning = localize(prompt.meaning, useLocale());
  return (
    <div className="flex flex-col gap-2 text-center">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t("progress", { current: position, total })}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
          {t("skip")}
        </Button>
      </div>
      <p className="text-muted-foreground">{t("howDoYouSay")}</p>
      <p className="text-3xl font-semibold" lang={meaning?.locale}>
        {meaning?.text}
      </p>
    </div>
  );
}
