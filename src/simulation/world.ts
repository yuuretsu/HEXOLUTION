import { ENERGY_PER_CELL } from "@/shared/constants";
import type { Rgba } from "@/shared/types";
import { GridMap, type IGrid } from "@/shared/utils/grid";

const staticAttackResult = { energy: 0 };
let nextWorldItemId = 1;

export abstract class WorldItemStatic {
  readonly CLASS_NAME: string = "WorldItemStatic";
  id = nextWorldItemId++;

  rebindId() {
    this.id = nextWorldItemId++;
  }

  getColor(): Rgba {
    return [255, 0, 255, 255];
  }

  getEnergyColor(): Rgba {
    return [100, 100, 100, 255];
  }

  getGenomeHashColor(): Rgba {
    return [100, 100, 100, 255];
  }

  getColoration(): Rgba {
    return [100, 100, 100, 255];
  }

  getLastActionColor(): Rgba {
    return [100, 100, 100, 255];
  }

  handleAttack(_world: World, _strength: number): { energy: number } {
    staticAttackResult.energy = 0;
    return staticAttackResult;
  }
}

export abstract class WorldItemDynamic extends WorldItemStatic {
  readonly CLASS_NAME: string = "WorldItemDynamic";
  abstract process(world: World, x: number, y: number): void;
}

export type WorldItem = WorldItemStatic | WorldItemDynamic;

const isWorldItemDynamic = (item: WorldItem): item is WorldItemDynamic =>
  "process" in item;

export const sendEnergy = (from: { energy: number }, to: { energy: number }, amount: number) => {
  const energy = Math.min(from.energy, amount);
  from.energy -= energy;
  to.energy += energy;
};

export class World {
  readonly grid: IGrid<WorldItem>;
  readonly totalEnergy: number;
  energy: number;
  constructor(width: number, height: number) {
    this.grid = new GridMap(width, height)
    this.totalEnergy = width * height * ENERGY_PER_CELL;
    this.energy = this.totalEnergy;
  }
}
