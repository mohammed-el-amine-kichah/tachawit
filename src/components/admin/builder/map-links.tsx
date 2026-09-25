"use client";

import { MapPinIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createLevel } from "@/app/actions/admin/map";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { useAdminAction } from "../use-admin-action";

export type MapLevel = { id: string; unitId: string; label: string };
export type UnitOption = { id: string; title: string };

/** Where a lesson or quiz sits on the map, with a shortcut to put it on a new level. */
export function MapLinks({ kind, contentId, levels, units }: { kind: "lesson" | "quiz"; contentId: string; levels: MapLevel[]; units: UnitOption[] }) {
  const t = useTranslations("Admin.builder");
  const [open, setOpen] = useState(false);
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const { run, pending } = useAdminAction();
  const title = units.find((u) => u.id === unitId)?.title ?? "";

  const add = () => run(() => createLevel(unitId, kind, contentId), { success: t("addedToMap", { unit: title }), onSuccess: () => setOpen(false) });

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="flex items-center gap-1.5 font-medium">
        <MapPinIcon aria-hidden className="size-4 text-primary" />
        {t("onMap")}
      </span>
      {levels.length === 0 && <span className="text-muted-foreground">{t("notOnMapYet")}</span>}
      {levels.map((level) => (
        <Link key={level.id} href={`/admin/units/${level.unitId}?level=${level.id}`} className="rounded-full bg-muted px-3 py-1 hover:bg-muted/70">
          {level.label}
        </Link>
      ))}
      {units.length > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" variant={levels.length ? "ghost" : "outline"}>
              <PlusIcon aria-hidden />
              {t("addToMap")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addToMap")}</DialogTitle>
              <DialogDescription>{t("addToMapLead")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1">
              <Label htmlFor="add-to-map-unit">{t("unit")}</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger id="add-to-map-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={add} disabled={pending || !unitId} className="self-start">
              {t("addToUnit", { unit: title })}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
