import type { ComponentType } from "react";
import type { MapTheme } from "@/lib/supabase/queries/units";
import { Cedar } from "./cedar";
import { CliffVillage } from "./cliff-village";
import { Dune } from "./dune";
import { Palm } from "./palm";
import { Peak } from "./peak";
import { Ridge } from "./ridge";
import { Rocks } from "./rocks";

type Decor = { Drawing: ComponentType; width: number; height: number };

/** The decor each map theme is drawn with. Sizes are in px at scale 1. */
export const themeDecor: Record<MapTheme, Decor[]> = {
  aures_peaks: [
    { Drawing: Peak, width: 150, height: 108 },
    { Drawing: Ridge, width: 140, height: 80 },
    { Drawing: Rocks, width: 80, height: 40 },
  ],
  cedar_forest: [
    { Drawing: Cedar, width: 90, height: 130 },
    { Drawing: Cedar, width: 70, height: 100 },
    { Drawing: Rocks, width: 80, height: 40 },
  ],
  cliff_villages: [
    { Drawing: CliffVillage, width: 130, height: 150 },
    { Drawing: Rocks, width: 80, height: 40 },
    { Drawing: Ridge, width: 140, height: 80 },
  ],
  palm_groves: [
    { Drawing: Palm, width: 90, height: 140 },
    { Drawing: Dune, width: 140, height: 60 },
    { Drawing: Palm, width: 70, height: 110 },
  ],
};

/** Region background colour token for each theme. */
export const themeTint: Record<MapTheme, string> = {
  aures_peaks: "var(--map-peaks)",
  cedar_forest: "var(--map-cedar)",
  cliff_villages: "var(--map-cliffs)",
  palm_groves: "var(--map-palms)",
};
