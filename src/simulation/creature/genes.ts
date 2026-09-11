import * as GeneLibrary from "./gene-library";
import type { GeneHandler } from "./gene-types";

export * from "./constants";
export * from "./gene-colors";
export * from "./gene-library";
export type { GeneHandler, GeneHandlerResult } from "./gene-types";

const GENES: GeneHandler[] = Object.values(GeneLibrary);

export const getGeneHandler = (index: number): GeneHandler => GENES[index % GENES.length];
