import type { Rgba } from "@/shared/types";

export const CellType = {
  Apex: 0,
  Leaf: 1,
  Antenna: 2,
  Root: 3,
  Wood: 4,
  Seed: 5,
} as const;

export type CellType = (typeof CellType)[keyof typeof CellType];

export const CELL_TYPE_NAMES: Record<CellType, string> = {
  [CellType.Apex]: "отросток",
  [CellType.Leaf]: "лист",
  [CellType.Antenna]: "антена",
  [CellType.Root]: "корень",
  [CellType.Wood]: "древесина",
  [CellType.Seed]: "семечко",
};

/** Standard view colors (CLANS3 cellColor). */
export const CELL_COLORS: Record<CellType, Rgba> = {
  [CellType.Apex]: [255, 253, 183, 255],
  [CellType.Leaf]: [0, 255, 0, 255],
  [CellType.Antenna]: [0, 0, 255, 255],
  [CellType.Root]: [255, 0, 0, 255],
  [CellType.Wood]: [60, 60, 60, 255],
  [CellType.Seed]: [234, 232, 182, 255],
};

export const POISON_ORGANIC_COLOR: Rgba = [255, 224, 201, 255];
export const POISON_ENERGY_COLOR: Rgba = [204, 204, 255, 255];
