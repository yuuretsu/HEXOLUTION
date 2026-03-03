import * as GeneLibrary from "./gene-library";
import type { GeneHandler } from "./gene-types";

export * from "./constants";
export * from "./gene-library";
export type { GeneHandler, GeneHandlerResult } from "./gene-types";

const GENES = Object.values(GeneLibrary) as GeneHandler[];

export const getGeneHandler = (index: number): GeneHandler => GENES[index % GENES.length];
