import { shuffle } from "@/shared/utils";
import { WorldItemDynamic, type World } from "./world";

export interface ITickStrategy {
  tickOnce(world: World): void;
}

export class RandomSampleTickStrategy implements ITickStrategy {
  tickOnce(world: World): void {
    const { width, height } = world.grid;
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const item = world.grid.get(x, y);
    if (item instanceof WorldItemDynamic) item.process(world, x, y);
  }
}

export class ShuffleTickStrategy implements ITickStrategy {
  private pending: [x: number, y: number, item: WorldItemDynamic][] = [];
  private index = 0;

  tickOnce(world: World): void {
    if (this.index >= this.pending.length) {
      this.pending.length = 0;
      for (const [x, y, item] of world.grid.entries()) {
        if (item instanceof WorldItemDynamic) this.pending.push([x, y, item]);
      }
      shuffle(this.pending);
      this.index = 0;
    }
    const entry = this.pending[this.index++];
    if (entry) entry[2].process(world, entry[0], entry[1]);
  }
}
