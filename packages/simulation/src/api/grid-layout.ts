import { CellKind, type CellSnapshot } from "./types";

export { CellKind };
/** Bytes per packed grid cell. */
export const GRID_CELL_STRIDE = 16;
/** Packed layout version for buffer consumers. */
export const GRID_LAYOUT_VERSION = 1;
/** Sentinel: cell has no last gene. */
export const LAST_GENE_NONE = 255;

/** Write a cell snapshot into the packed grid buffer. */
export const writeCell = (view: DataView, cellIndex: number, cell: CellSnapshot): void => {
  const o = cellIndex * GRID_CELL_STRIDE;
  view.setUint8(o + 0, cell.kind);
  view.setUint8(o + 1, cell.lastGene);
  view.setUint16(o + 2, cell.energy, true);
  view.setUint8(o + 4, cell.display[0]);
  view.setUint8(o + 5, cell.display[1]);
  view.setUint8(o + 6, cell.display[2]);
  view.setUint8(o + 7, 0);
  view.setUint8(o + 8, cell.coloration[0]);
  view.setUint8(o + 9, cell.coloration[1]);
  view.setUint8(o + 10, cell.coloration[2]);
  view.setUint8(o + 11, 0);
  view.setUint8(o + 12, cell.genomeHash[0]);
  view.setUint8(o + 13, cell.genomeHash[1]);
  view.setUint8(o + 14, cell.genomeHash[2]);
  view.setUint8(o + 15, 0);
};

/** Read a cell snapshot from the packed grid buffer. */
export const readCell = (view: DataView, cellIndex: number): CellSnapshot => {
  const o = cellIndex * GRID_CELL_STRIDE;
  const kindByte = view.getUint8(o + 0);
  const kind =
    kindByte === CellKind.Creature
    || kindByte === CellKind.Organic
    || kindByte === CellKind.Stone
      ? kindByte
      : CellKind.Empty;
  return {
    kind,
    lastGene: view.getUint8(o + 1),
    energy: view.getUint16(o + 2, true),
    display: [view.getUint8(o + 4), view.getUint8(o + 5), view.getUint8(o + 6)],
    coloration: [view.getUint8(o + 8), view.getUint8(o + 9), view.getUint8(o + 10)],
    genomeHash: [view.getUint8(o + 12), view.getUint8(o + 13), view.getUint8(o + 14)],
  };
};

/** Clear a packed cell to empty. */
export const clearCell = (view: DataView, cellIndex: number): void => {
  writeCell(view, cellIndex, {
    kind: CellKind.Empty,
    lastGene: LAST_GENE_NONE,
    energy: 0,
    display: [0, 0, 0],
    coloration: [0, 0, 0],
    genomeHash: [0, 0, 0],
  });
};
