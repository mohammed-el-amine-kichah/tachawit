"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { writingScripts, type WritingScript } from "@/lib/contribute/scripts";
import { cn } from "@/lib/utils";

export type WrittenValues = Record<WritingScript, string> & { meaning: string };

const FIELD: Record<WritingScript, { dir: "ltr" | "rtl"; lang: string; className?: string }> = {
  latin: { dir: "ltr", lang: "shy-Latn" },
  arabic: { dir: "rtl", lang: "shy-Arab", className: "font-arabic" },
  tifinagh: { dir: "ltr", lang: "shy-Tfng", className: "font-tifinagh" },
};

/** What the speaker said, written in the scripts they choose to use (all optional). */
export function WrittenForm({
  scripts,
  onToggleScript,
  values,
  onChange,
  withMeaning,
}: {
  scripts: readonly WritingScript[];
  onToggleScript: (script: WritingScript) => void;
  values: WrittenValues;
  onChange: (values: WrittenValues) => void;
  withMeaning: boolean;
}) {
  const t = useTranslations("Contribute");
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{t("writeIt")}</p>
      <div role="group" aria-label={t("writeIn")} className="flex flex-wrap gap-2">
        {writingScripts.map((script) => {
          const on = scripts.includes(script);
          return (
            <button
              key={script}
              type="button"
              aria-pressed={on}
              onClick={() => onToggleScript(script)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm ring-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "bg-primary text-primary-foreground ring-primary" : "ring-border hover:bg-muted",
              )}
            >
              {t(`scripts.${script}`)}
            </button>
          );
        })}
      </div>
      {scripts.map((script) => (
        <div key={script} className="flex flex-col gap-1">
          <Label htmlFor={`written-${script}`} className="text-muted-foreground">
            {t(`fields.${script}`)}
          </Label>
          <Input
            id={`written-${script}`}
            dir={FIELD[script].dir}
            lang={FIELD[script].lang}
            maxLength={200}
            autoComplete="off"
            value={values[script]}
            onChange={(e) => onChange({ ...values, [script]: e.target.value })}
            className={cn("h-12 text-lg", FIELD[script].className)}
          />
        </div>
      ))}
      {withMeaning && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="written-meaning" className="text-muted-foreground">
            {t("meaning")}
          </Label>
          <Input id="written-meaning" maxLength={200} value={values.meaning} onChange={(e) => onChange({ ...values, meaning: e.target.value })} />
        </div>
      )}
    </div>
  );
}
