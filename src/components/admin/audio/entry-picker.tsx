"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { searchEntries, type EntryOption } from "@/app/actions/admin/entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localize } from "@/i18n/localize";
import { localizedTextSchema } from "@/lib/content/localized-text";
import { QuickEntryForm } from "../entries/quick-entry-form";
import { StatusBadge } from "../status-badge";

/** Search entries by spelling or meaning and pick one, or create a missing one on the spot. */
export function EntryPicker({ onPick, autoFocus }: { onPick: (entry: EntryOption) => void; autoFocus?: boolean }) {
  const t = useTranslations("Admin.picker");
  const locale = useLocale();
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntryOption[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      void searchEntries(query).then((found) => alive && setResults(found));
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SearchIcon aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={t("search")}
          aria-controls={id}
          placeholder={t("search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus={autoFocus}
          className="ps-9"
        />
      </div>
      <ul id={id} role="listbox" aria-label={t("results")} className="max-h-72 overflow-y-auto rounded-lg ring-1 ring-border">
        {results.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted-foreground">{t("none")}</li>}
        {results.map((entry) => {
          const meaning = localizedTextSchema.safeParse(entry.translations);
          return (
            <li key={entry.id} role="option" aria-selected={false}>
              <button type="button" onClick={() => onPick(entry)} className="flex w-full items-center gap-3 px-3 py-2 text-start hover:bg-muted">
                <span className="font-semibold" dir="ltr">
                  {entry.text_latin}
                </span>
                <span className="flex-1 truncate text-sm text-muted-foreground">
                  {meaning.success ? localize(meaning.data, locale)?.text : null}
                </span>
                <StatusBadge status={entry.status} />
              </button>
            </li>
          );
        })}
      </ul>
      {creating ? (
        <QuickEntryForm initialLatin={query.trim()} onCreated={onPick} onCancel={() => setCreating(false)} />
      ) : (
        query.trim() && (
          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setCreating(true)}>
            <PlusIcon aria-hidden />
            <span>
              {t("createNew", { text: query.trim() })}
            </span>
          </Button>
        )
      )}
    </div>
  );
}
