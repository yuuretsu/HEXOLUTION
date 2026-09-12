import type { Rgba } from "@hexolution/shared";
import { lerpRgb } from "@hexolution/shared";
import { ObjectPool } from "@hexolution/shared";
import { sendEnergy, WorldItemDynamic, type World } from "./world";
import { MAX_CELL_ENERGY } from "./constants";

const organicPool = new ObjectPool(() => new Organic(0));
const attackResult = { energy: 0 };
const colorScratch: Rgba = [25, 25, 50, 0];
const energyColorScratch: Rgba = [0, 0, 100, 255];
const ENERGY_COLOR_HOT: Rgba = [255, 255, 0, 255];
const ORGANIC_COLOR_FULL: Rgba = [75, 75, 50, 255];

export class Organic extends WorldItemDynamic {
  readonly CLASS_NAME = "Organic";

  energy: number;

  constructor(energy: number) {
    super();
    this.energy = energy;
  }

  static acquire(energy: number): Organic {
    const organic = organicPool.acquire();
    organic.energy = energy;
    organic.rebindId();
    return organic;
  }

  release(): void {
    organicPool.release(this);
  }

  getColor(): Rgba {
    colorScratch[0] = 25;
    colorScratch[1] = 25;
    colorScratch[2] = 50;
    colorScratch[3] = 0;
    lerpRgb(colorScratch, ORGANIC_COLOR_FULL, (this.energy / MAX_CELL_ENERGY) ** 2);
    return colorScratch;
  }

  getEnergyColor(): Rgba {
    energyColorScratch[0] = 0;
    energyColorScratch[1] = 0;
    energyColorScratch[2] = 100;
    energyColorScratch[3] = 255;
    lerpRgb(energyColorScratch, ENERGY_COLOR_HOT, this.energy / MAX_CELL_ENERGY);
    return energyColorScratch;
  }

  process(world: World, x: number, y: number): void {
    sendEnergy(this, world, 1);
    if (this.energy <= 0) {
      world.grid.set(x, y, undefined);
      this.release();
    }
  }

  handleAttack(_world: World, strength: number): { energy: number } {
    attackResult.energy = 0;
    sendEnergy(this, attackResult, strength);
    return attackResult;
  }
}
