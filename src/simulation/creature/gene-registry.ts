import {
  absorbLight,
  attackForward,
  checkSelfEnergy,
  displaceForward,
  inspectForward,
  moveForward,
  reproduce,
  resetGenomePointer,
  rotateRight,
  scanForward,
} from "./gene-library";
import type { GeneHandler } from "./gene-types";

const GENE_HANDLERS: readonly GeneHandler[] = [
  moveForward,
  rotateRight,
  reproduce,
  absorbLight,
  attackForward,
  checkSelfEnergy,
  scanForward,
  inspectForward,
  resetGenomePointer,
  displaceForward,
];

export class GeneRegistry {
  getHandler(index: number): GeneHandler {
    return GENE_HANDLERS[index % GENE_HANDLERS.length]!;
  }
}

export const geneRegistry = new GeneRegistry();

export const getGeneHandler = (index: number): GeneHandler =>
  geneRegistry.getHandler(index);
