import { describe, expect, it } from "vitest";
import { layoutMap } from "./layout";

const options = { width: 400, margin: 60, headerHeight: 140, levelSpacing: 150, minBodyHeight: 300 };

describe("layoutMap", () => {
  const units = [
    { id: "u1", levels: [{ id: "a", mapX: 0.5, mapY: 0.1 }, { id: "b", mapX: 0, mapY: 0.5 }, { id: "c", mapX: 1, mapY: 0.9 }] },
    { id: "u2", levels: [{ id: "d", mapX: 0.5, mapY: 0.5 }] },
  ];

  it("stacks unit regions vertically with a header and a body sized by level count", () => {
    const layout = layoutMap(units, options);
    expect(layout.units[0]).toEqual({ id: "u1", top: 0, height: 140 + 450, bodyTop: 140 });
    expect(layout.units[1]).toEqual({ id: "u2", top: 590, height: 140 + 300, bodyTop: 730 });
    expect(layout.height).toBe(590 + 440);
    expect(layout.width).toBe(400);
  });

  it("places nodes from their normalised coordinates, keeping them inside the margins", () => {
    const { nodes } = layoutMap(units, options);
    expect(nodes.a).toEqual({ x: 200, y: 140 + 45 });
    expect(nodes.b).toEqual({ x: 60, y: 140 + 225 });
    expect(nodes.c).toEqual({ x: 340, y: 140 + 405 });
    expect(nodes.d).toEqual({ x: 200, y: 730 + 150 });
  });

  it("lists node ids in journey order", () => {
    expect(layoutMap(units, options).order).toEqual(["a", "b", "c", "d"]);
  });
});
