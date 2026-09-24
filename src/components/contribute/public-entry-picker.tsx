"use client";

import { XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { searchPublishedEntries, type PublicEntryOption } from "@/app/actions/contribute";
import { Input } from "@/components/ui/input";
import { localize } from "@/i18n/localize";
import { localizedTextSchema } from "@/lib/content/localized-text";

/** Point at an existing word (for a variation or correction). */
export function PublicEntryPicker({ label, value, onChange }: { label: string; value: PublicEntryOption | null; onChange: (entry: PublicEntryOption | null) => void }) {
  const t = useTranslations("Contribute");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicEntryOption[]>([]);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => void searchPublishedEntries(query).then((r) => alive && setResults(r)), 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const meaning = (e: PublicEntryOption) => {
    const parsed = localizedTextSchema.safeParse(e.translations);
    return parsed.success ? localize(parsed.data, locale)?.text : "";
  };

  if (value) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <span className="font-semibold" dir="ltr">
            {value.text_latin}
          </span>
          <span className="text-sm text-muted-foreground">{meaning(value)}</span>
          <button type="button" onClick={() => onChange(null)} aria-label={t("clearWord")} className="rounded p-0.5 hover:bg-background">
            <XIcon aria-hidden className="size-4" />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="entry-search" className="text-sm font-medium">
        {label}
      </label>
      <Input id="entry-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchWord")} autoComplete="off" />
      {results.length > 0 && (
        <ul className="rounded-lg ring-1 ring-border">
          {results.map((entry) => (
            <li key={entry.id}>
              <button type="button" onClick={() => onChange(entry)} className="flex w-full items-center gap-3 px-3 py-2 text-start hover:bg-muted">
                <span className="font-semibold" dir="ltr">
                  {entry.text_latin}
                </span>
                <span className="text-sm text-muted-foreground">{meaning(entry)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
