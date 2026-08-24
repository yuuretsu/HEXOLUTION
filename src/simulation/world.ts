import { ENERGY_PER_CELL } from "shared/constants";
import type { Rgba } from "shared/types";
import { shuffle } from "shared/utils";
import { GridMap, type IGrid } from "shared/utils/grid";

const staticAttackResult = { energy: 0 };

export abstract class WorldItemStatic {
  readonly CLASS_NAME: string = "WorldItemStatic";

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

  step() {
    const dynamicItems: [x: number, y: number, item: WorldItemDynamic][] = [];

    for (const [x, y, item] of this.grid.entries()) {
      if ("process" in item) {
        dynamicItems.push([x, y, item as WorldItemDynamic]);
      }
    }

    shuffle(dynamicItems);
    dynamicItems.forEach(([x, y, item]) => item.process(this, x, y));
  }
}
