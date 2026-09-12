import { describe, expect, it } from "vitest";
import type { Rgb } from "./types";
import {
  GRID_CELL_STRIDE,
  GRID_LAYOUT_VERSION,
  LAST_GENE_NONE,
  CellKind,
  writeCell,
  readCell,
} from "./grid-layout";

const rgb = (r: number, g: number, b: number): Rgb => [r, g, b];

describe("grid-layout", () => {
  it("round-trips a creature cell at 16-byte stride", () => {
    expect(GRID_CELL_STRIDE).toBe(16);
    expect(GRID_LAYOUT_VERSION).toBe(1);

    const buffer = new ArrayBuffer(GRID_CELL_STRIDE * 2);
    const view = new DataView(buffer);
    const cell = {
      kind: CellKind.Creature,
      lastGene: 3,
      energy: 750,
      display: rgb(10, 20, 30),
      coloration: rgb(40, 50, 60),
      genomeHash: rgb(70, 80, 90),
    };
    writeCell(view, 1, cell);
    expect(readCell(view, 1)).toEqual(cell);
    expect(readCell(view, 0).kind).toBe(CellKind.Empty);
  });

  it("supports LAST_GENE_NONE", () => {
    const buffer = new ArrayBuffer(GRID_CELL_STRIDE);
    const view = new DataView(buffer);
    writeCell(view, 0, {
      kind: CellKind.Empty,
      lastGene: LAST_GENE_NONE,
      energy: 0,
      display: rgb(0, 0, 0),
      coloration: rgb(0, 0, 0),
      genomeHash: rgb(0, 0, 0),
    });
    expect(readCell(view, 0).lastGene).toBe(255);
  });
});
