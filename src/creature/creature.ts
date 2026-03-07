import { Dichotomy } from "dichotomy";
import { getRandomBase4, Tape } from "tape";
import type { Rgba } from "types";
import { createRandom, hslaToRgba, lerpRgb } from "utils";
import { sendEnergy, WorldItemDynamic, type World } from "world";
import { getGeneHandler } from "./genes";
import { MAX_CELL_ENERGY } from "../constants";

export class Food extends WorldItemDynamic {
  readonly CLASS_NAME = "Food";

  energy: number;
  constructor(energy: number) {
    super()
    this.energy = energy;
  }

  getColor(): Rgba {
    const color: Rgba = [25, 25, 50, 0]
    lerpRgb(color, [75, 75, 50, 255], (this.energy / 1000) ** 2);
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

export class Creature extends WorldItemDynamic {
  readonly CLASS_NAME = "Creature";

  _direction: number = ~~(Math.random() * 6);
  readonly tape: Tape;
  age = 0;
  energy: number;
  readonly color: Rgba;
  readonly autotrophOrHeterotroph: Dichotomy;
  genomeHashColor: Rgba;

  constructor(energy: number, tape: Tape, autotrophOrHeterotroph: number, color: Rgba) {
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
      if (Math.random() > 0.0001) continue;
      tapeData[i] = getRandomBase4();
    }
    return new Creature(0, new Tape(new Uint8Array(tapeData)), this.autotrophOrHeterotroph.right, color);
  }

  process(world: World, x: number, y: number): void {
    if (this.energy <= 0 || this.energy >= MAX_CELL_ENERGY) return this.die(world, x, y);

    for (let i = 0; i < 16; i++) {
      const handle = getGeneHandler(this.tape.readInt());
      const result = handle(this, world, x, y);
      if (result.isFinished) break;
    }
    sendEnergy(this, world, Math.floor(this.age * 0.0005));
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
}
