"use client";

import { FileSpreadsheetIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { importEntries } from "@/app/actions/admin/entries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseCsv, rowsToEntries } from "@/lib/admin/csv";

const TEMPLATE = "text_latin,text_arabic,text_tifinagh,en,fr,ar,part_of_speech,region,notes\n";

/** Paste or open a CSV, check it, then import every valid row as a draft. */
export function CsvImport({ regionsBySlug }: { regionsBySlug: Record<string, string> }) {
  const t = useTranslations("Admin.import");
  const [csv, setCsv] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<number | null>(null);
  const preview = useMemo(() => (csv.trim() ? rowsToEntries(parseCsv(csv), regionsBySlug) : null), [csv, regionsBySlug]);

  const submit = () =>
    startTransition(async () => {
      const result = await importEntries(csv);
      if (!result.ok) return void toast.error(t("failed"));
      setDone(result.data.imported);
      setCsv("");
      toast.success(t("imported", { count: result.data.imported }));
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-muted/60 p-4 text-sm">
        <p className="font-medium">{t("columns")}</p>
        <code className="mt-1 block overflow-x-auto whitespace-pre text-xs" dir="ltr">
          {TEMPLATE}
        </code>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
          download="tachawit-entries.csv"
          className="mt-2 inline-block font-medium text-primary underline underline-offset-2"
        >
          {t("template")}
        </a>
      </div>

      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
        <FileSpreadsheetIcon aria-hidden className="size-4" />
        {t("openFile")}
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setCsv(await file.text());
          }}
        />
      </label>
      <Textarea dir="ltr" rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={t("paste")} className="font-mono text-sm" aria-label={t("paste")} />

      {preview && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="font-medium">{t("ready", { count: preview.entries.length })}</p>
          {preview.errors.length > 0 && (
            <ul className="list-inside list-disc text-sm text-destructive">
              {preview.errors.map((error) => (
                <li key={error.line}>{t(`problems.${error.problem}`, { line: error.line })}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {done !== null && <p className="text-sm text-success">{t("imported", { count: done })}</p>}

      <Button type="button" disabled={!preview?.entries.length || pending} onClick={submit} className="self-start">
        {pending ? t("importing") : t("importButton", { count: preview?.entries.length ?? 0 })}
      </Button>
    </div>
  );
}
