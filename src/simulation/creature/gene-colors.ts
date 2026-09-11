import type { Rgba } from "@/shared/types";
import {
  COLOR_ATTACK,
  COLOR_MOVE_FORWARD,
  COLOR_PHOTOSYNTHESIS,
  COLOR_PUSH,
} from "./constants";
import {
  absorbLight,
  attackForward,
  displaceForward,
  inspectForward,
  moveForward,
  reproduce,
} from "./gene-library";
import type { GeneHandler } from "./gene-types";

export const COLOR_REPRODUCE: Rgba = [255, 255, 255, 255];
export const COLOR_INSPECT: Rgba = [255, 255, 0, 255];
export const DEFAULT_GENE_COLOR: Rgba = [100, 100, 100, 255];

const GENE_COLORS: Record<string, Rgba> = {
  [absorbLight.name]: COLOR_PHOTOSYNTHESIS,
  [attackForward.name]: COLOR_ATTACK,
  [reproduce.name]: COLOR_REPRODUCE,
  [moveForward.name]: COLOR_MOVE_FORWARD,
  [displaceForward.name]: COLOR_PUSH,
  [inspectForward.name]: COLOR_INSPECT,
};

export const getGeneColor = (handler: GeneHandler): Rgba =>
  GENE_COLORS[handler.name] ?? DEFAULT_GENE_COLOR;
