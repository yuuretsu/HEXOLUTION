import type { World } from "../world";
import type { Creature } from "./creature";

export type GeneHandlerResult = Readonly<{
  isFinished: boolean;
}>

export type GeneHandler = (creature: Creature, world: World, x: number, y: number) => GeneHandlerResult;
