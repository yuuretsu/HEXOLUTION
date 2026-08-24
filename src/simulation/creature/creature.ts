import { Dichotomy } from "simulation/dichotomy";
import { getRandomBase4, Tape } from "simulation/tape";
import type { Rgba } from "shared/types";
import { createRandom, hslaToRgba, lerpRgb, randomLightColor, mutateColor } from "shared/utils";
import { sendEnergy, WorldItemDynamic, type World } from "simulation/world";
import { getGeneHandler } from "./genes";
import {
  AGE_ENERGY_COST_FACTOR,
  COLORATION_MUTATION_RATE,
  GENES_PER_TICK,
  GENOME_MUTATION_RATE,
  MAX_CELL_ENERGY,
} from "shared/constants";
import { Food } from "simulation/food";

export class Creature extends WorldItemDynamic {
  readonly CLASS_NAME = "Creature";

  _direction: number = ~~(Math.random() * 6);
  readonly tape: Tape;
  age = 0;
  energy: number;
  readonly color: Rgba;
  readonly coloration: Rgba;
  readonly autotrophOrHeterotroph: Dichotomy;
  genomeHashColor: Rgba;

  constructor(energy: number, tape: Tape, autotrophOrHeterotroph: number, color: Rgba, coloration?: Rgba) {
    super()
    this.tape = tape;
    this.genomeHashColor = (() => {
      const hash = this.tape.data.join("");
      const random = createRandom(hash);
      return hslaToRgba(random() * 360, 100, 50, 1);
    })()
    this.energy = energy;
    this.autotrophOrHeterotroph = new Dichotomy(autotrophOrHeterotroph)
    this.color = color
    this.coloration = coloration ?? randomLightColor()
  }

  get direction() {
    return this._direction
  }

  set direction(value: number) {
    this._direction = ((value % 6) + 6) % 6;
  }

  handleAttack(world: World, strength: number): { energy: number } {
    sendEnergy(this, world, 1);
    const e = { energy: 0 }
    sendEnergy(this, e, strength);
    return e;
  }

  die(world: World, x: number, y: number) {
    world.grid.set(x, y, new Food(this.energy));
  }

  reproduce() {
    const tapeData = [...this.tape.data]
    const color = [...this.color] as Rgba;
    lerpRgb(color, [100, 100, 100, 255], 0.5);
    for (let i = 0; i < tapeData.length; i++) {
      if (Math.random() > GENOME_MUTATION_RATE) continue;
      tapeData[i] = getRandomBase4();
    }
    const coloration = mutateColor(this.coloration, COLORATION_MUTATION_RATE);
    return new Creature(0, new Tape(new Uint8Array(tapeData)), this.autotrophOrHeterotroph.right, color, coloration);
  }

  process(world: World, x: number, y: number): void {
    if (this.energy <= 0 || this.energy >= MAX_CELL_ENERGY) return this.die(world, x, y);

    for (let i = 0; i < GENES_PER_TICK; i++) {
      const handle = getGeneHandler(this.tape.readInt());
      const result = handle(this, world, x, y);
      if (result.isFinished) break;
    }
    sendEnergy(this, world, Math.floor(this.age * AGE_ENERGY_COST_FACTOR));
    this.age += 1;
  }

  getColor(): Rgba {
    return this.color
  }

  getEnergyColor(): Rgba {
    const color: Rgba = [0, 0, 100, 255];
    lerpRgb(color, [255, 255, 0, 255], this.energy / MAX_CELL_ENERGY);
    return color;
  }

  getGenomeHashColor(): Rgba {
    return this.genomeHashColor;
  }

  getColoration(): Rgba {
    return this.coloration;
  }
}
