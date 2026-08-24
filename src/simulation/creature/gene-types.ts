import type { World } from "../world";
import type { Creature } from "./creature";

export type GeneHandlerResult = Readonly<{
  isFinished: boolean;
}>;

export const GENE_FINISHED: GeneHandlerResult = Object.freeze({ isFinished: true });
export const GENE_CONTINUE: GeneHandlerResult = Object.freeze({ isFinished: false });

export type GeneHandler = (creature: Creature, world: World, x: number, y: number) => GeneHandlerResult;
