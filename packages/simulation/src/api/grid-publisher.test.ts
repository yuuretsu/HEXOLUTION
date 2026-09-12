import { describe, expect, it } from "vitest";
import { World } from "../world";
import { Stone } from "../stone";
import { GRID_CELL_STRIDE, GRID_LAYOUT_VERSION, readCell } from "./grid-layout";
import { CellKind } from "./types";
import { GridPublisher } from "./grid-publisher";

describe("GridPublisher", () => {
  it("writes stone cells and bumps generation", () => {
    const world = new World(2, 2);
    world.grid.set(0, 0, new Stone());
    const publisher = new GridPublisher(world);
    const first = publisher.publish(0, 0);
    expect(first.meta.layoutVersion).toBe(GRID_LAYOUT_VERSION);
    expect(first.meta.stride).toBe(GRID_CELL_STRIDE);
    expect(first.meta.generation).toBe(1);
    expect(first.stats.worldEntries.some(([name]) => name === "Stone")).toBe(true);

    const view = new DataView(first.meta.buffer);
    expect(readCell(view, 0).kind).toBe(CellKind.Stone);
    expect(readCell(view, 0).display[0]).toBeGreaterThan(0);

    const second = publisher.publish(0, 1);
    expect(second.meta.generation).toBe(2);
  });
});
