import { Dichotomy } from "simulation/dichotomy";
import { getRandomBase4, Tape } from "simulation/tape";
import type { Rgba } from "shared/types";
import {
  createRandom,
  hslaToRgba,
  lerpRgb,
  mutateColorInto,
  randomLightColorInto,
} from "shared/utils";
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

const creaturePool: Creature[] = [];
const attackResult = { energy: 0 };
const GRAY: Rgba = [100, 100, 100, 255];
const ENERGY_COLOR_HOT: Rgba = [255, 255, 0, 255];
const energyColorScratch: Rgba = [0, 0, 100, 255];

export class Creature extends WorldItemDynamic {
  readonly CLASS_NAME = "Creature";

  _direction: number = ~~(Math.random() * 6);
  readonly tape: Tape;
  age = 0;
  energy: number;
  readonly color: Rgba;
  readonly coloration: Rgba;
  readonly autotrophOrHeterotroph: Dichotomy;
  readonly genomeHashColor: Rgba;

  constructor(energy: number, tape: Tape, autotrophOrHeterotroph: number, color: Rgba, coloration?: Rgba) {
    super();
    this.tape = tape;
    this.genomeHashColor = [0, 0, 0, 255];
    this.refreshGenomeHashColor();
    this.energy = energy;
    this.autotrophOrHeterotroph = new Dichotomy(autotrophOrHeterotroph);
    this.color = color;
    this.coloration = coloration ?? randomLightColorInto([0, 0, 0, 255]);
  }

  static acquire(
    energy: number,
    tape: Tape,
    autotrophOrHeterotroph: number,
    color: Rgba,
    coloration?: Rgba,
  ): Creature {
    const pooled = creaturePool.pop();
    if (!pooled) return new Creature(energy, tape, autotrophOrHeterotroph, color, coloration);
    pooled.reset(energy, tape.data, autotrophOrHeterotroph, color, coloration);
    return pooled;
  }

  reset(
    energy: number,
    tapeData: Uint8Array,
    autotrophOrHeterotroph: number,
    color: Rgba,
    coloration?: Rgba,
  ): void {
    if (this.tape.data.length !== tapeData.length) {
      this.tape.data = new Uint8Array(tapeData.length);
    }
    this.tape.data.set(tapeData);
    this.tape.pointer = 0;
    this.energy = energy;
    this.age = 0;
    this._direction = ~~(Math.random() * 6);
    this.autotrophOrHeterotroph.right = autotrophOrHeterotroph;
    this.color[0] = color[0];
    this.color[1] = color[1];
    this.color[2] = color[2];
    this.color[3] = color[3];
    if (coloration) {
      this.coloration[0] = coloration[0];
      this.coloration[1] = coloration[1];
      this.coloration[2] = coloration[2];
      this.coloration[3] = coloration[3];
    } else {
      randomLightColorInto(this.coloration);
    }
    this.refreshGenomeHashColor();
  }

  release(): void {
    creaturePool.push(this);
  }

  refreshGenomeHashColor(): void {
    const hash = this.tape.data.join("");
    const random = createRandom(hash);
    const color = hslaToRgba(random() * 360, 100, 50, 1);
    this.genomeHashColor[0] = color[0];
    this.genomeHashColor[1] = color[1];
    this.genomeHashColor[2] = color[2];
    this.genomeHashColor[3] = color[3];
  }

  get direction() {
    return this._direction;
  }

  set direction(value: number) {
    this._direction = ((value % 6) + 6) % 6;
  }

  handleAttack(world: World, strength: number): { energy: number } {
    sendEnergy(this, world, 1);
    attackResult.energy = 0;
    sendEnergy(this, attackResult, strength);
    return attackResult;
  }

  die(world: World, x: number, y: number) {
    const energy = this.energy;
    this.energy = 0;
    world.grid.set(x, y, Food.acquire(energy));
    this.release();
  }

  reproduce() {
    const child = creaturePool.pop() ?? new Creature(
      0,
      new Tape(new Uint8Array(this.tape.data.length)),
      0,
      [0, 0, 0, 255],
      [0, 0, 0, 255],
    );

    const src = this.tape.data;
    let dst = child.tape.data;
    if (dst.length !== src.length) {
      dst = new Uint8Array(src.length);
      child.tape.data = dst;
    }
    for (let i = 0; i < src.length; i++) {
      dst[i] = Math.random() > GENOME_MUTATION_RATE ? src[i] : getRandomBase4();
    }
    child.tape.pointer = 0;
    child.energy = 0;
    child.age = 0;
    child._direction = ~~(Math.random() * 6);

    child.color[0] = this.color[0];
    child.color[1] = this.color[1];
    child.color[2] = this.color[2];
    child.color[3] = this.color[3];
    lerpRgb(child.color, GRAY, 0.5);

    mutateColorInto(child.coloration, this.coloration, COLORATION_MUTATION_RATE);
    child.autotrophOrHeterotroph.right = this.autotrophOrHeterotroph.right;
    child.refreshGenomeHashColor();
    return child;
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
    return this.color;
  }

  getEnergyColor(): Rgba {
    energyColorScratch[0] = 0;
    energyColorScratch[1] = 0;
    energyColorScratch[2] = 100;
    energyColorScratch[3] = 255;
    lerpRgb(energyColorScratch, ENERGY_COLOR_HOT, this.energy / MAX_CELL_ENERGY);
    return energyColorScratch;
  }

  getGenomeHashColor(): Rgba {
    return this.genomeHashColor;
  }

  getColoration(): Rgba {
    return this.coloration;
  }
}
