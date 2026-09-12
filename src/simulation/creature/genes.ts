import type { GeneHandler } from "./gene-types";
import { GENE_HANDLERS } from "./gene-library";

export * from "./constants";
export * from "./gene-colors";
export * from "./gene-library";
export type { GeneHandler, GeneHandlerResult } from "./gene-types";

export const getGeneHandler = (index: number): GeneHandler =>
  GENE_HANDLERS[index % GENE_HANDLERS.length];
