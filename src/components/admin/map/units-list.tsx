"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reorderUnits, saveUnit } from "@/app/actions/admin/map";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localize } from "@/i18n/localize";
import { getPathname, Link } from "@/i18n/navigation";
import { moveItem } from "@/lib/admin/builder";
import { mapThemes } from "@/lib/content/enums";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { MapTheme } from "@/lib/supabase/queries/units";
import { emptyLocalized, LocalizedFields } from "../localized-fields";
import { StatusBadge } from "../status-badge";
import { useAdminAction } from "../use-admin-action";
import { ChoiceSelect } from "../choice-select";

type UnitRow = { id: string; title: LocalizedText; status: "draft" | "published"; levels: number; published: number };

export function UnitsList({ units: serverUnits }: { units: UnitRow[] }) {
  const t = useTranslations("Admin.map");
  const themes = useTranslations("MapTheme");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [units, setUnits] = useState(serverUnits);
  const [loadedFrom, setLoadedFrom] = useState(serverUnits);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ slug: "", title: emptyLocalized, description: emptyLocalized, map_theme: "aures_peaks" as MapTheme, cover_image_path: "" });

  if (serverUnits !== loadedFrom) {
    setLoadedFrom(serverUnits);
    setUnits(serverUnits);
  }

  const move = (from: number, to: number) => {
    const next = moveItem(units, from, to);
    setUnits(next);
    run(() => reorderUnits(next.map((u) => u.id)), { quiet: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="self-start">
            <PlusIcon aria-hidden />
            {t("newUnit")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newUnit")}</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => saveUnit(null, draft), { onSuccess: (r) => r.id && router.push(getPathname({ href: `/admin/units/${r.id}`, locale })) });
            }}
          >
            <LocalizedFields id="new-unit-title" label={t("unitTitle")} required value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="new-unit-slug">{t("slug")}</Label>
                <Input id="new-unit-slug" dir="ltr" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase() })} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="new-unit-theme">{t("theme")}</Label>
                <ChoiceSelect
                  id="new-unit-theme"
                  value={draft.map_theme}
                  onChange={(v) => v && setDraft({ ...draft, map_theme: v })}
                  options={mapThemes.map((theme) => ({ value: theme, label: themes(theme) }))}
                />
              </div>
            </div>
            <Button type="submit" disabled={pending} className="self-start">
              {t("createUnit")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ol className="flex flex-col gap-2">
        {units.map((unit, index) => (
          <li key={unit.id} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-border">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">{index + 1}</span>
            <Link href={`/admin/units/${unit.id}`} className="min-w-0 flex-1 font-medium hover:underline">
              {localize(unit.title, locale)?.text}
            </Link>
            <span className="text-sm text-muted-foreground">{t("levelCount", { count: unit.levels, published: unit.published })}</span>
            <StatusBadge status={unit.status} />
            <Button variant="ghost" size="icon-sm" aria-label={t("moveUp")} disabled={index === 0 || pending} onClick={() => move(index, index - 1)}>
              <ArrowUpIcon aria-hidden />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={t("moveDown")} disabled={index === units.length - 1 || pending} onClick={() => move(index, index + 1)}>
              <ArrowDownIcon aria-hidden />
            </Button>
          </li>
        ))}
      </ol>
    </div>
  );
}
