import type { Rgba } from "@/shared/types";
import type { EntityKind } from "./entity-kind";
import type { World } from "./world";

export type AttackResult = Readonly<{ energy: number }>;

export interface IWorldItem {
  readonly id: number;
  readonly kind: EntityKind;
}

export interface IColorProvider {
  getColor(): Rgba;
  getEnergyColor(): Rgba;
  getGenomeHashColor(): Rgba;
  getColoration(): Rgba;
}

export interface IAttackable {
  handleAttack(world: World, strength: number): AttackResult;
}

export interface IProcessable {
  process(world: World, x: number, y: number): void;
}

export interface IEnergyHolder {
  energy: number;
}
