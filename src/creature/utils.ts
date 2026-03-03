import type { World } from "world";
import type { Creature } from "./creature";

export const scanRay = (creature: Creature, world: World, x: number, y: number, distance: number) => {
  for (let d = 1; d <= distance; d++) {
    const coords = world.grid.getCoordsByNarrow(x, y, creature.direction, d);
    const target = world.grid.get(...coords);
    if (target) return target;
  }
  return null;
};