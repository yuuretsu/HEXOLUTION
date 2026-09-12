import type { GeneContext } from "./gene-context";

export type GeneHandlerResult = Readonly<{
  isFinished: boolean;
}>;

export const GENE_FINISHED: GeneHandlerResult = Object.freeze({ isFinished: true });
export const GENE_CONTINUE: GeneHandlerResult = Object.freeze({ isFinished: false });

export type GeneHandler = (ctx: GeneContext) => GeneHandlerResult;
