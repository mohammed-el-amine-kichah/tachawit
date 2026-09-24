import type { CSSProperties } from "react";
import { placeScenery, seedFrom } from "@/lib/map/scenery";
import { MAP_LAYOUT, SCENERY_SPACING } from "@/lib/map/constants";
import type { MapTheme } from "@/lib/supabase/queries/units";
import { themeDecor, themeTint } from "./scenery";

const COLUMN_HALF = MAP_LAYOUT.width / 2;

/** Illustrated background of one unit: tinted sky, distant ridges and decor along both edges. */
export function MapScenery({ unitId, theme, nextTheme, height }: { unitId: string; theme: MapTheme; nextTheme: MapTheme; height: number }) {
  const decor = themeDecor[theme];
  const items = placeScenery({ height, seed: seedFrom(unitId), spacing: SCENERY_SPACING, kinds: decor.length });

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(to bottom, ${themeTint[theme]}, ${themeTint[nextTheme]})` }}
    >
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="parallax absolute inset-x-0 top-24 h-40 w-full opacity-35 mask-b-from-40%"
        style={{ "--parallax": "50px" } as CSSProperties}
      >
        <path d="M0 120 L0 70 L50 40 L90 62 L140 20 L190 58 L240 30 L290 64 L340 36 L400 60 L400 120 Z" className="fill-map-far" />
      </svg>
      {items.map((item, index) => {
        const { Drawing, width, height: h } = decor[item.kind];
        const itemWidth = width * item.scale;
        // Hug the screen edge on phones; on wide screens flank the path column instead.
        const edge = `max(${-24 + item.inset * 28}px, calc(50% - ${COLUMN_HALF + itemWidth + item.inset * 140}px))`;
        return (
          <div
            key={index}
            className="parallax absolute"
            style={
              {
                top: item.top,
                [item.side]: edge,
                width: itemWidth,
                height: h * item.scale,
                "--parallax": `${12 + (index % 3) * 10}px`,
              } as CSSProperties
            }
          >
            <Drawing />
          </div>
        );
      })}
    </div>
  );
}
