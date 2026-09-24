"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LocalizedFormValue } from "./localized-form";

export { emptyLocalized, toLocalizedForm, type LocalizedFormValue } from "./localized-form";

const FIELDS = [
  { key: "en", lang: "en", dir: "ltr" },
  { key: "fr", lang: "fr", dir: "ltr" },
  { key: "ar", lang: "ar", dir: "rtl" },
  { key: "dz", lang: "ar-DZ", dir: "rtl" },
] as const;

/** One input per UI language, each in its own direction. */
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
  const Field = multiline ? Textarea : Input;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">
        {label}
        {required && <span className="text-muted-foreground"> · {t("atLeastOne")}</span>}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {FIELDS.map(({ key, lang, dir }) => (
          <div key={key} className="flex flex-col gap-1">
            <Label htmlFor={`${id}-${key}`} className="text-xs text-muted-foreground">
              {t(key)}
            </Label>
            <Field
              id={`${id}-${key}`}
              lang={lang}
              dir={dir}
              value={value[key]}
              onChange={(event) => onChange({ ...value, [key]: event.target.value })}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
