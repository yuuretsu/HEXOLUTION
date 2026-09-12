export const CellKind = {
  Empty: 0,
  Creature: 1,
  Organic: 2,
  Stone: 3,
} as const;
export type CellKind = (typeof CellKind)[keyof typeof CellKind];

export type Rgb = [r: number, g: number, b: number];

export type CellSnapshot = {
  kind: CellKind;
  lastGene: number;
  energy: number;
  display: Rgb;
  coloration: Rgb;
  genomeHash: Rgb;
};

export type GridBufferMeta = {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  stride: number;
  generation: number;
  layoutVersion: number;
};

export type GeneMeta = {
  id: number;
  name: string;
  color: [r: number, g: number, b: number, a: number];
};
