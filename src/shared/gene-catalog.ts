import type { Rgba } from "./types";

export type GeneDisplayInfo = {
  name: string;
  displayColor?: Rgba;
};

/** Display metadata for each gene, indexed by genome instruction number. */
export const GENE_CATALOG: readonly GeneDisplayInfo[] = [
  { name: "moveForward", displayColor: [0, 150, 255, 255] },
  { name: "rotateRight" },
  { name: "reproduce", displayColor: [255, 255, 255, 255] },
  { name: "absorbLight", displayColor: [0, 200, 0, 255] },
  { name: "attackForward", displayColor: [255, 0, 0, 255] },
  { name: "checkSelfEnergy" },
  { name: "scanForward" },
  { name: "inspectForward", displayColor: [255, 255, 0, 255] },
  { name: "resetGenomePointer" },
  { name: "displaceForward", displayColor: [0, 0, 255, 255] },
];

export const getGeneDisplayInfo = (index: number): GeneDisplayInfo =>
  GENE_CATALOG[index % GENE_CATALOG.length]!;
