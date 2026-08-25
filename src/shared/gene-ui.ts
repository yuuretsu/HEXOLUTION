import type { Rgba } from "@/shared/types";
import { base4toInt } from "@/shared/utils";
import {
  COLOR_ATTACK,
  COLOR_MOVE_FORWARD,
  COLOR_PHOTOSYNTHESIS,
  COLOR_PUSH,
} from "@/shared/constants";

/** Gene metadata for UI — order matches the Rust gene dispatch table. */
export type GeneInfo = {
  name: string;
  color?: Rgba;
};

export const GENES: GeneInfo[] = [
  { name: "moveForward", color: COLOR_MOVE_FORWARD },
  { name: "rotateRight" },
  { name: "reproduce", color: [255, 255, 255, 255] },
  { name: "absorbLight", color: COLOR_PHOTOSYNTHESIS },
  { name: "attackForward", color: COLOR_ATTACK },
  { name: "checkSelfEnergy" },
  { name: "scanForward" },
  { name: "inspectForward", color: [255, 255, 0, 255] },
  { name: "resetGenomePointer" },
  { name: "displaceForward", color: COLOR_PUSH },
];

export const getGeneInfo = (index: number): GeneInfo =>
  GENES[index % GENES.length];

export const geneInfoFromTriplet = (a: number, b: number, c: number): GeneInfo =>
  getGeneInfo(base4toInt(a, b, c));
