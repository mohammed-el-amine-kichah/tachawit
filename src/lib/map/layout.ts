export type LayoutLevel = { id: string; mapX: number; mapY: number };
export type LayoutUnit = { id: string; levels: LayoutLevel[] };

export type LayoutOptions = {
  /** Width of the map coordinate space. */
  width: number;
  /** Horizontal space kept free on each side so nodes and labels never touch the edge. */
  margin: number;
  /** Space at the top of each unit for its banner. */
  headerHeight: number;
  /** Vertical room per level in a unit's body. */
  levelSpacing: number;
  minBodyHeight: number;
};

export type Point = { x: number; y: number };

export type MapLayout = {
  width: number;
  height: number;
  units: { id: string; top: number; height: number; bodyTop: number }[];
  nodes: Record<string, Point>;
  /** Level ids in journey order. */
  order: string[];
};

/** Turns the normalised node positions stored per unit into one continuous vertical map. */
export function layoutMap(units: readonly LayoutUnit[], options: LayoutOptions): MapLayout {
  const { width, margin, headerHeight, levelSpacing, minBodyHeight } = options;
  const layout: MapLayout = { width, height: 0, units: [], nodes: {}, order: [] };
  let top = 0;

  for (const unit of units) {
    const bodyHeight = Math.max(minBodyHeight, unit.levels.length * levelSpacing);
    const bodyTop = top + headerHeight;
    layout.units.push({ id: unit.id, top, height: headerHeight + bodyHeight, bodyTop });

    for (const level of unit.levels) {
      layout.nodes[level.id] = {
        x: margin + level.mapX * (width - 2 * margin),
        y: bodyTop + level.mapY * bodyHeight,
      };
      layout.order.push(level.id);
    }
    top += headerHeight + bodyHeight;
  }
  layout.height = top;
  return layout;
}
