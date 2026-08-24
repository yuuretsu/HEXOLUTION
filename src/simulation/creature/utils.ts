import type { World } from "@/simulation/world";
import type { Creature } from "./creature";

const rayCoords: [number, number] = [0, 0];

export const scanRay = (creature: Creature, world: World, x: number, y: number, distance: number) => {
  for (let d = 1; d <= distance; d++) {
    world.grid.getCoordsByNarrow(x, y, creature.direction, d, rayCoords);
    const target = world.grid.get(rayCoords[0], rayCoords[1]);
    if (target) return target;
  }
  return null;
};
