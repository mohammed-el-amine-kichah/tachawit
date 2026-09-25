"use client";

import { AudioLinesIcon, EyeOffIcon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { setEntriesStatus, setEntryStatus } from "@/app/actions/admin/entries";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "../status-badge";
import { useAdminAction } from "../use-admin-action";

export type EntryListRow = {
  id: string;
  latin: string;
  scripts: string;
  meaning: string;
  region: string | null;
  clips: number;
  status: "draft" | "published";
};

/** Entries with quick publish on each row, and publish or unpublish for everything selected. */
export function EntryList({ rows }: { rows: EntryListRow[] }) {
  const t = useTranslations("Admin.entries");
  const { run, pending } = useAdminAction();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggle = (rowId: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(rowId);
      else next.delete(rowId);
      return next;
    });

  const batch = (next: "draft" | "published") => {
    const ids = [...selected];
    run(() => setEntriesStatus(ids, next), {
      success: t(next === "published" ? "batchPublished" : "batchUnpublished", { count: ids.length }),
      onSuccess: () => setSelected(new Set()),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-xl bg-card px-4 py-2 shadow-soft ring-1 ring-border">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(on) => setSelected(on === true ? new Set(rows.map((r) => r.id)) : new Set())}
            aria-label={t("selectAll")}
          />
          {selected.size ? t("selected", { count: selected.size }) : t("selectAll")}
        </label>
        {selected.size > 0 && (
          <div className="ms-auto flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={pending} onClick={() => batch("published")} className="bg-success text-success-foreground hover:bg-success/90">
              <SendIcon aria-hidden />
              {t("publishSelected", { count: selected.size })}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => batch("draft")}>
              <EyeOffIcon aria-hidden />
              {t("unpublishSelected", { count: selected.size })}
            </Button>
          </div>
        )}
      </div>

      <ul className="divide-y rounded-xl bg-card ring-1 ring-border">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 ps-4 pe-2">
            <Checkbox checked={selected.has(row.id)} onCheckedChange={(on) => toggle(row.id, on === true)} aria-label={t("selectEntry", { entry: row.latin })} />
            <Link
              href={`/admin/entries/${row.id}`}
              className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:opacity-80 sm:grid-cols-[1.2fr_1.5fr_auto_auto]"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold" dir="ltr" lang="shy-Latn">
                  {row.latin}
                </span>
                <span className="block truncate text-sm text-muted-foreground">{row.scripts}</span>
              </span>
              <span className="col-span-2 truncate text-sm sm:col-span-1">
                {row.meaning}
                {row.region && <span className="text-muted-foreground"> · {row.region}</span>}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground" title={t("recordingsCount", { count: row.clips })}>
                <AudioLinesIcon aria-hidden className="size-4" />
                {row.clips}
              </span>
              <StatusBadge status={row.status} />
            </Link>
            <Button
              type="button"
              size="sm"
              variant={row.status === "draft" ? "secondary" : "ghost"}
              disabled={pending}
              onClick={() =>
                run(() => setEntryStatus(row.id, row.status === "draft" ? "published" : "draft"), {
                  success: t(row.status === "draft" ? "publishedToast" : "unpublishedToast"),
                })
              }
            >
              {row.status === "draft" ? t("publish") : t("unpublish")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
