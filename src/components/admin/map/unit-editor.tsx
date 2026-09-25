"use client";

import { PlusIcon, WandSparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createLevel, reorderLevels, saveLevelPositions } from "@/app/actions/admin/map";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { autoArrange, moveItem } from "@/lib/admin/builder";
import { levelTypes } from "@/lib/content/enums";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { MapTheme } from "@/lib/supabase/queries/units";
import { useAdminAction } from "../use-admin-action";
import { MapCanvas, type CanvasLevel } from "./map-canvas";
import { LevelPanel, type PanelLevel } from "./level-panel";

export type EditorLevel = CanvasLevel & PanelLevel;
type Option = { id: string; title: LocalizedText; status: "draft" | "published" };

/** Map editor for one unit: place nodes on the scenery, order them and configure each level. */
export function UnitEditor({
  unitId,
  theme,
  unitStatus,
  initialLevelId,
  levels: serverLevels,
  lessons,
  quizzes,
  units,
}: {
  unitId: string;
  theme: MapTheme;
  unitStatus: "draft" | "published";
  initialLevelId: string | null;
  levels: EditorLevel[];
  lessons: Option[];
  quizzes: Option[];
  units: { id: string; title: LocalizedText }[];
}) {
  const t = useTranslations("Admin.map");
  const lt = useTranslations("LevelType");
  const { run, pending } = useAdminAction();
  const [levels, setLevels] = useState(serverLevels);
  const [loadedFrom, setLoadedFrom] = useState(serverLevels);
  const [selectedId, setSelectedId] = useState<string | null>(initialLevelId);

  // Fresh data from the server (after any save) replaces the local copy.
  if (serverLevels !== loadedFrom) {
    setLoadedFrom(serverLevels);
    setLevels(serverLevels);
  }

  const move = (id: string, x: number, y: number) => setLevels((current) => current.map((l) => (l.id === id ? { ...l, x, y } : l)));
  const commit = (id: string) => {
    const level = levels.find((l) => l.id === id);
    if (level) run(() => saveLevelPositions([{ id, x: level.x, y: level.y }]), { quiet: true });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section aria-label={t("canvas")} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" disabled={pending}>
                <PlusIcon aria-hidden />
                {t("addLevel")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {levelTypes.map((type) => (
                <DropdownMenuItem key={type} onSelect={() => run(() => createLevel(unitId, type), { success: t("levelAdded"), onSuccess: (r) => r.id && setSelectedId(r.id) })}>
                  {lt(type)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="outline"
            disabled={pending || levels.length === 0}
            onClick={() => {
              const places = autoArrange(levels.length);
              setLevels(levels.map((l, i) => ({ ...l, ...places[i] })));
              run(() => saveLevelPositions(levels.map((l, i) => ({ id: l.id, ...places[i] }))), { success: t("arranged") });
            }}
          >
            <WandSparklesIcon aria-hidden />
            {t("autoArrange")}
          </Button>
          <p className="text-sm text-muted-foreground">{t("canvasHint")}</p>
        </div>
        {levels.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-16 text-center text-muted-foreground">{t("noLevels")}</p>
        ) : (
          <MapCanvas unitId={unitId} theme={theme} levels={levels} selectedId={selectedId} onSelect={setSelectedId} onMove={move} onCommit={commit} />
        )}
      </section>
      <aside aria-label={t("levels")}>
        <LevelPanel
          unitId={unitId}
          unitStatus={unitStatus}
          levels={levels}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={(from, to) => {
            const next = moveItem(levels, from, to);
            setLevels(next);
            run(() => reorderLevels(unitId, next.map((l) => l.id)), { quiet: true });
          }}
          lessons={lessons}
          quizzes={quizzes}
          units={units}
        />
      </aside>
    </div>
  );
}
