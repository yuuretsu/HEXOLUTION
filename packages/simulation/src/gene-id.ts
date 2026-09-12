import { base4toInt } from "@hexolution/shared";

/** Encode three base-4 genome bases into a gene id (same encoding as Tape.readInt). */
export const geneIdFromBases = (a: number, b: number, c: number): number =>
  base4toInt(a, b, c);
