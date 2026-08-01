import type { Rgba } from "types";
import { lerpRgb } from "utils";
import { sendEnergy, WorldItemDynamic, type World } from "world";
import { MAX_CELL_ENERGY } from "./constants";

export class Food extends WorldItemDynamic {
  readonly CLASS_NAME = "Food";

  energy: number;
  constructor(energy: number) {
    super()
    this.energy = energy;
  }

  getColor(): Rgba {
    const color: Rgba = [25, 25, 50, 0]
    lerpRgb(color, [75, 75, 50, 255], (this.energy / MAX_CELL_ENERGY) ** 2);
    return color;
  }

  getEnergyColor(): Rgba {
    const color: Rgba = [0, 0, 100, 255];
    lerpRgb(color, [255, 255, 0, 255], this.energy / MAX_CELL_ENERGY);
    return color;
  }

  process(world: World, x: number, y: number): void {
    sendEnergy(this, world, 1);
    if (this.energy <= 0) {
      world.grid.set(x, y, undefined);
    }
  }

  handleAttack(world: World, strength: number): { energy: number } {
    const e = { energy: 0 }
    sendEnergy(this, e, strength);
    return e;
  }
}