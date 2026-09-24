"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { LevelIcon } from "@/components/map/level-icon";
import { MapScenery } from "@/components/map/map-scenery";
import { localize } from "@/i18n/localize";
import { MAP_LAYOUT } from "@/lib/map/constants";
import { pathSegments } from "@/lib/map/path";
import type { LocalizedText } from "@/lib/content/localized-text";
import type { LevelType, MapTheme } from "@/lib/supabase/queries/units";
import { cn } from "@/lib/utils";

export type CanvasLevel = { id: string; type: LevelType; title: LocalizedText | null; x: number; y: number; status: "draft" | "published" };

const { width: W, margin: M } = MAP_LAYOUT;
const clamp = (n: number) => Math.min(1, Math.max(0, Math.round(n * 1000) / 1000));

/**
 * The unit's region of the map, as learners see it. Drag a node to place it (or focus it and use
 * the arrow keys); the position is saved when you let go.
 */
export function MapCanvas({
  unitId,
  theme,
  levels,
  selectedId,
  onSelect,
  onMove,
  onCommit,
}: {
  unitId: string;
  theme: MapTheme;
  levels: CanvasLevel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onCommit: (id: string) => void;
}) {
  const t = useTranslations("Admin.map");
  const locale = useLocale();
  const canvas = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const bodyHeight = Math.max(MAP_LAYOUT.minBodyHeight, levels.length * MAP_LAYOUT.levelSpacing);
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (keyTimer.current) clearTimeout(keyTimer.current);
  }, []);

  const toCoord = (level: CanvasLevel) => ({ x: M + level.x * (W - 2 * M), y: level.y * bodyHeight });
  const segments = pathSegments(levels.map(toCoord));

  const pointerToPosition = (event: PointerEvent) => {
    const rect = canvas.current!.getBoundingClientRect();
    const fx = ((event.clientX - rect.left) / rect.width) * W;
    return { x: clamp((fx - M) / (W - 2 * M)), y: clamp((event.clientY - rect.top) / rect.height) };
  };

  const onKey = (event: KeyboardEvent, level: CanvasLevel) => {
    const step = event.shiftKey ? 0.05 : 0.01;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    onMove(level.id, clamp(level.x + delta[0]), clamp(level.y + delta[1]));
    if (keyTimer.current) clearTimeout(keyTimer.current);
    keyTimer.current = setTimeout(() => onCommit(level.id), 600);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-border" style={{ height: bodyHeight }}>
      <MapScenery unitId={unitId} theme={theme} nextTheme={theme} height={bodyHeight} />
      <div ref={canvas} className="relative mx-auto h-full max-w-[420px]" dir="ltr">
        <svg viewBox={`0 0 ${W} ${bodyHeight}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          {segments.map((d, i) => (
            <path key={i} d={d} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={8} strokeDasharray="1 14" strokeLinecap="round" className="stroke-primary/60" />
          ))}
        </svg>
        {levels.map((level, index) => {
          const { x, y } = toCoord(level);
          const label = localize(level.title, locale)?.text ?? t("levelNumber", { number: index + 1 });
          return (
            <button
              key={level.id}
              type="button"
              aria-label={t("nodeLabel", { label, x: Math.round(level.x * 100), y: Math.round(level.y * 100) })}
              aria-pressed={selectedId === level.id}
              onClick={() => onSelect(level.id)}
              onKeyDown={(event) => onKey(event, level)}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragging(level.id);
                onSelect(level.id);
              }}
              onPointerMove={(event) => {
                if (dragging !== level.id) return;
                const next = pointerToPosition(event);
                onMove(level.id, next.x, next.y);
              }}
              onPointerUp={() => {
                if (dragging === level.id) onCommit(level.id);
                setDragging(null);
              }}
              style={{ left: `${(x / W) * 100}%`, top: y }}
              className={cn(
                "absolute grid size-14 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full border-b-4 border-shade shadow-soft",
                level.status === "published" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-2 ring-dashed ring-muted-foreground/40",
                selectedId === level.id && "ring-4 ring-gold",
                dragging === level.id ? "cursor-grabbing" : "cursor-grab",
              )}
            >
              <LevelIcon type={level.type} className="size-6" />
              <span className="absolute top-full mt-1 max-w-32 truncate rounded-full bg-card/90 px-2 text-xs font-semibold text-foreground">
                {index + 1}. {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
