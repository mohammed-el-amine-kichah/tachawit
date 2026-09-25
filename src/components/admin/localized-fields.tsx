"use client";

import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LocalizedFormValue } from "./localized-form";

export { emptyLocalized, toLocalizedForm, type LocalizedFormValue } from "./localized-form";

const FIELDS = [
  { key: "en", lang: "en", dir: "ltr" },
  { key: "fr", lang: "fr", dir: "ltr" },
  { key: "ar", lang: "ar", dir: "rtl" },
] as const;

/** One tab per UI language, the current one first; a dot on each tab shows whether it is filled in. */
export function LocalizedFields({
  id,
  label,
  value,
  onChange,
  multiline,
  required,
}: {
  id: string;
  label: string;
  value: LocalizedFormValue;
  onChange: (value: LocalizedFormValue) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  const t = useTranslations("Admin.languages");
  const locale = useLocale();
  const Field = multiline ? Textarea : Input;
  const fields = [...FIELDS].sort((a, b) => Number(b.key === locale) - Number(a.key === locale));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">
        {label}
        {required && <span className="text-muted-foreground"> · {t("atLeastOne")}</span>}
      </legend>
      <Tabs defaultValue={fields[0].key}>
        <TabsList>
          {fields.map(({ key }) => {
            const filled = value[key].trim() !== "";
            return (
              <TabsTrigger key={key} value={key} className="gap-1.5 px-3">
                {t(key)}
                <span aria-hidden className={cn("size-1.5 rounded-full", filled ? "bg-success" : "ring-1 ring-muted-foreground/60")} />
                <span className="sr-only">{t(filled ? "filled" : "empty")}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {fields.map(({ key, lang, dir }) => (
          <TabsContent key={key} value={key}>
            <Field
              id={`${id}-${key}`}
              aria-label={`${label} (${t(key)})`}
              lang={lang}
              dir={dir}
              value={value[key]}
              onChange={(event) => onChange({ ...value, [key]: event.target.value })}
            />
          </TabsContent>
        ))}
      </Tabs>
    </fieldset>
  );
}
