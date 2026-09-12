import { describe, expect, it } from "vitest";
import {
  GRID_CELL_STRIDE,
  writeCell,
  CellKind,
  LAST_GENE_NONE,
} from "@/simulation/api/grid-layout";
import { colorizeGrid } from "./grid-colorizer";

describe("colorizeGrid", () => {
  it("writes creature display RGB in normal mode", () => {
    const width = 1;
    const height = 1;
    const grid = new ArrayBuffer(GRID_CELL_STRIDE);
    writeCell(new DataView(grid), 0, {
      kind: CellKind.Creature,
      lastGene: LAST_GENE_NONE,
      energy: 100,
      display: [1, 2, 3],
      coloration: [0, 0, 0],
      genomeHash: [0, 0, 0],
    });
    const result = colorizeGrid({
      gridBuffer: grid,
      width,
      height,
      stride: GRID_CELL_STRIDE,
      layoutVersion: 1,
      viewMode: "normal",
      geneMeta: [],
    });
    expect(result).not.toBeNull();
    const px = new Uint32Array(result!.buffer)[0];
    expect(px).toBe(((255 << 24) | (3 << 16) | (2 << 8) | 1) >>> 0);
  });

  it("returns null when layoutVersion mismatches", () => {
    expect(
      colorizeGrid({
        gridBuffer: new ArrayBuffer(16),
        width: 1,
        height: 1,
        stride: 16,
        layoutVersion: 999,
        viewMode: "normal",
        geneMeta: [],
      }),
    ).toBeNull();
  });
});
