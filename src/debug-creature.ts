import type { Rgba } from "types";
import { clampCycle } from "utils";
import { World, WorldItemDynamic } from "world";

export class DebugCreature extends WorldItemDynamic {
  readonly CLASS_NAME = "DebugCreature";

  _direction = ~~(Math.random() * 6);

  get direction() {
    return this._direction;
  }

  set direction(value: number) {
    this._direction = clampCycle(value, 6);
  }

  process(world: World, x: number, y: number): void {
    if (Math.random() > 0.999) this.direction += 1;
    const coordsFwd = world.grid.getCoordsByNarrow(x, y, this.direction);
    const target = world.grid.get(...coordsFwd);
    if (target) return;
    world.grid.swap(x, y, ...coordsFwd);
  }

  getColor(): Rgba {
    return [100, 200, 50, 255];
  }
}