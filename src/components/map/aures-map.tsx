"use client";

import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@/components/progress/progress-provider";
import { MAP_LAYOUT } from "@/lib/map/constants";
import { layoutMap } from "@/lib/map/layout";
import { pathSegments } from "@/lib/map/path";
import { diffLevelStates, type Celebration } from "@/lib/progress/celebration";
import { readSeenStates, writeSeenStates } from "@/lib/progress/seen-states";
import { computeLevelStates } from "@/lib/progress/unlock";
import type { MapUnit } from "@/lib/supabase/queries/units";
import { LevelNode } from "./level-node";
import { MapPath, type PathSegment } from "./map-path";
import { MapScenery } from "./map-scenery";
import { UnitBanner } from "./unit-banner";

const NOTHING: Celebration = { completed: [], unlocked: [] };

/** The home screen: an illustrated journey through the Aurès, one region per unit. */
export function AuresMap({ units }: { units: MapUnit[] }) {
  const t = useTranslations("Map");
  const { snapshot, ready } = useProgress();
  const reduceMotion = useReducedMotion();
  const layout = useMemo(() => layoutMap(units, MAP_LAYOUT), [units]);
  const states = useMemo(() => computeLevelStates(units, snapshot.levels), [units, snapshot.levels]);

  // What the learner saw last time, read once when the map mounts in the browser.
  const [seenBefore] = useState(readSeenStates);
  const celebration = ready ? diffLevelStates(seenBefore, states) : NOTHING;

  useEffect(() => {
    if (ready) writeSeenStates(states);
  }, [ready, states]);

  const currentId = layout.order.find((id) => states[id]?.status === "current");
  const focusId = celebration.unlocked[0] ?? celebration.completed[0] ?? currentId;
  const scrolled = useRef(false);
  useEffect(() => {
    if (!ready || scrolled.current || !focusId || focusId === layout.order[0]) return;
    scrolled.current = true;
    document.getElementById(`level-${focusId}`)?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }, [ready, focusId, layout.order, reduceMotion]);

  const points = layout.order.map((id) => layout.nodes[id]);
  const segments: PathSegment[] = pathSegments(points).map((d, i) => {
    const from = states[layout.order[i]];
    const toId = layout.order[i + 1];
    const to = states[toId];
    return {
      d,
      walked: ready && from?.status === "completed" && to?.status !== "locked",
      drawIn: celebration.unlocked.includes(toId),
    };
  });

  return (
    <div className="relative" style={{ height: layout.height }}>
      {units.map((unit, index) => {
        const region = layout.units[index];
        const done = ready ? unit.levels.filter((l) => states[l.id]?.status === "completed").length : null;
        return (
          <section
            key={unit.id}
            aria-label={t("unitRegion", { number: index + 1 })}
            className="absolute inset-x-0"
            style={{ top: region.top, height: region.height }}
          >
            <MapScenery
              unitId={unit.id}
              theme={unit.mapTheme}
              nextTheme={units[index + 1]?.mapTheme ?? unit.mapTheme}
              height={region.height}
            />
            <UnitBanner unit={unit} number={index + 1} done={done} />
          </section>
        );
      })}

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="relative mx-auto h-full max-w-[420px]">
          <MapPath width={layout.width} height={layout.height} segments={segments} />
          <ol>
            {units.flatMap((unit) =>
              unit.levels.map((level) => {
                const state = states[level.id];
                const node = layout.nodes[level.id];
                return (
                  <li key={level.id}>
                    <LevelNode
                      id={level.id}
                      number={layout.order.indexOf(level.id) + 1}
                      type={level.type}
                      title={level.title}
                      status={ready ? state.status : "pending"}
                      stars={state.stars}
                      left={(node.x / layout.width) * 100}
                      top={node.y}
                      celebrate={
                        celebration.completed.includes(level.id)
                          ? "completed"
                          : celebration.unlocked.includes(level.id)
                            ? "unlocked"
                            : null
                      }
                    />
                  </li>
                );
              }),
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}
