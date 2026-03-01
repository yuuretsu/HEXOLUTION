import type { Rgba } from "types";
import { shuffle } from "utils";
import { GridMap, type IGrid } from "utils/grid";

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

  handleAttack(world: World, strength: number): { energy: number } {
    return { energy: 0 };
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
  energy: number = 100000;
  constructor(width: number, height: number) {
    this.grid = new GridMap(width, height)
    // this.energy = width * height * 0.01;
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
