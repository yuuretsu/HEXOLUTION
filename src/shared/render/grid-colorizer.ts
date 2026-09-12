import { MAX_CELL_ENERGY } from "@/shared/constants";
import type { Rgba, ViewMode } from "@/shared/types";
import { lerpRgb } from "@/shared/utils";
import {
  CellKind,
  GRID_LAYOUT_VERSION,
  LAST_GENE_NONE,
  readCell,
} from "@/simulation/api/grid-layout";
import type { GeneMeta, Rgb } from "@/simulation/api/types";
import {
  DEFAULT_GENE_DISPLAY,
  ENERGY_COLOR_COLD,
  ENERGY_COLOR_HOT,
  FALLBACK_GRAY,
  ORGANIC_COLOR_EMPTY,
  ORGANIC_COLOR_FULL,
} from "./view-palette";

export type ColorizeGridArgs = {
  gridBuffer: ArrayBuffer;
  width: number;
  height: number;
  stride: number;
  layoutVersion: number;
  viewMode: ViewMode;
  geneMeta: GeneMeta[];
};

export type ColorizeGridResult = {
  buffer: ArrayBuffer;
  width: number;
  height: number;
};

const packRgba = (r: number, g: number, b: number, a = 255) =>
  (a << 24) | (b << 16) | (g << 8) | r;

const packFrom = (color: Rgba) => packRgba(color[0], color[1], color[2], color[3]);

const energyScratch: Rgba = [0, 0, 0, 255];
const organicScratch: Rgba = [0, 0, 0, 0];

const energyColor = (energy: number): Rgba => {
  energyScratch[0] = ENERGY_COLOR_COLD[0];
  energyScratch[1] = ENERGY_COLOR_COLD[1];
  energyScratch[2] = ENERGY_COLOR_COLD[2];
  energyScratch[3] = ENERGY_COLOR_COLD[3];
  lerpRgb(energyScratch, ENERGY_COLOR_HOT, energy / MAX_CELL_ENERGY);
  return energyScratch;
};

const organicNormalColor = (energy: number): Rgba => {
  organicScratch[0] = ORGANIC_COLOR_EMPTY[0];
  organicScratch[1] = ORGANIC_COLOR_EMPTY[1];
  organicScratch[2] = ORGANIC_COLOR_EMPTY[2];
  organicScratch[3] = ORGANIC_COLOR_EMPTY[3];
  lerpRgb(organicScratch, ORGANIC_COLOR_FULL, (energy / MAX_CELL_ENERGY) ** 2);
  return organicScratch;
};

const geneColor = (lastGene: number, geneMeta: GeneMeta[]): Rgba => {
  if (lastGene === LAST_GENE_NONE || geneMeta.length === 0) return DEFAULT_GENE_DISPLAY;
  const gene = geneMeta[lastGene % geneMeta.length];
  return gene?.color ?? DEFAULT_GENE_DISPLAY;
};

const colorOrganic = (energy: number, viewMode: ViewMode): number => {
  if (viewMode === "normal") return packFrom(organicNormalColor(energy));
  if (viewMode === "energy") return packFrom(energyColor(energy));
  return packRgba(FALLBACK_GRAY[0], FALLBACK_GRAY[1], FALLBACK_GRAY[2]);
};

const colorCreature = (
  energy: number,
  display: Rgb,
  coloration: Rgb,
  genomeHash: Rgb,
  lastGene: number,
  viewMode: ViewMode,
  geneMeta: GeneMeta[],
): number => {
  switch (viewMode) {
    case "normal":
      return packRgba(display[0], display[1], display[2]);
    case "energy":
      return packFrom(energyColor(energy));
    case "genome-hash":
      return packRgba(genomeHash[0], genomeHash[1], genomeHash[2]);
    case "coloration":
      return packRgba(coloration[0], coloration[1], coloration[2]);
    case "last-action":
      return packFrom(geneColor(lastGene, geneMeta));
    default:
      return packRgba(255, 0, 255);
  }
};

const colorForCell = (
  kind: number,
  energy: number,
  display: Rgb,
  coloration: Rgb,
  genomeHash: Rgb,
  lastGene: number,
  viewMode: ViewMode,
  geneMeta: GeneMeta[],
): number => {
  if (kind === CellKind.Empty) return 0;
  if (kind === CellKind.Stone) return packRgba(display[0], display[1], display[2]);
  if (kind === CellKind.Organic) return colorOrganic(energy, viewMode);
  return colorCreature(energy, display, coloration, genomeHash, lastGene, viewMode, geneMeta);
};

export const colorizeGrid = (args: ColorizeGridArgs): ColorizeGridResult | null => {
  if (args.layoutVersion !== GRID_LAYOUT_VERSION) return null;

  const { width, height, stride, gridBuffer, viewMode, geneMeta } = args;
  const cellCount = width * height;
  if (gridBuffer.byteLength < cellCount * stride) return null;

  const view = new DataView(gridBuffer);
  const out = new ArrayBuffer(cellCount * 4);
  const pixels = new Uint32Array(out);

  for (let i = 0; i < cellCount; i++) {
    const cell = readCell(view, i);
    pixels[i] = colorForCell(
      cell.kind,
      cell.energy,
      cell.display,
      cell.coloration,
      cell.genomeHash,
      cell.lastGene,
      viewMode,
      geneMeta,
    );
  }

  return { buffer: out, width, height };
};
