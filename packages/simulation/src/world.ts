import { ENERGY_PER_CELL } from "./constants";
import type { Rgba, IGrid } from "@hexolution/shared";
import { GridMap } from "@hexolution/shared";

const staticAttackResult = { energy: 0 };
let nextWorldItemId = 1;

export abstract class WorldItemStatic {
  get CLASS_NAME(): string {
    return "WorldItemStatic";
  }

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

  handleAttack(_ambient: { energy: number }, _strength: number): { energy: number } {
    staticAttackResult.energy = 0;
    return staticAttackResult;
  }
}

export abstract class WorldItemDynamic extends WorldItemStatic {
  override get CLASS_NAME(): string {
    return "WorldItemDynamic";
  }

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

export type World = {
  grid: IGrid<WorldItem>;
  energy: number;
  readonly totalEnergy: number;
};

/** Create a world with an empty grid and full ambient energy pool. */
export const createWorld = (width: number, height: number): World => {
  const totalEnergy = width * height * ENERGY_PER_CELL;
  return {
    grid: new GridMap(width, height),
    totalEnergy,
    energy: totalEnergy,
  };
};
