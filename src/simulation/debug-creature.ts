import type { Rgba } from "@/shared/types";
import { clampCycle } from "@/shared/utils";
import { World, WorldItemDynamic } from "@/simulation/world";

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
    const target = world.grid.get(coordsFwd[0], coordsFwd[1]);
    if (target) return;
    world.grid.swap(x, y, coordsFwd[0], coordsFwd[1]);
  }

  getColor(): Rgba {
    return [100, 200, 50, 255];
  }
}
