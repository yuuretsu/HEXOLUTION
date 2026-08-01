import { GENOME_LENGTH, HEX_ASPECT } from "shared/constants";
import type { IGrid } from "shared/utils/grid";
import { Creature } from "simulation/creature";
import { Stone } from "simulation/stone";
import { Tape } from "simulation/tape";
import type { World, WorldItem } from "simulation/world";

export const fillCircle = <T>(grid: IGrid<T>, sx: number, sy: number, sr: number, value?: (x: number, y: number) => T | undefined) => {
  const { width, height } = grid;
  const radiusSquared = sr * sr;
  const radiusCeilY = Math.floor(sr / HEX_ASPECT);

  for (let y = -radiusCeilY; y <= radiusCeilY; y++) {
    const maxX = Math.floor(Math.sqrt(radiusSquared - (y * HEX_ASPECT) ** 2));
    const worldY = ((Math.floor(sy) + y) % height + height) % height;
    for (let x = -maxX; x <= maxX; x++) {
      const worldX = ((Math.floor(sx) + x) % width + width) % width;
      grid.set(worldX, worldY, value?.(worldX, worldY));
    }
  }
};

export const populateWorld = async (world: World, renderProgress: () => void) => {
  const { width, height } = world.grid;

  for (let i = 0; i < 25; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const radius = Math.random() ** 20 * 50 + 50;
    fillCircle(world.grid, x, y, radius, () => new Stone());
    const angle = Math.random() * Math.PI * 2;
    fillCircle(world.grid, x + radius * 0.2 * Math.cos(angle), y + radius * 0.2 * Math.sin(angle), radius * 0.9);
    renderProgress();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  for (let i = 0; i < 50_000; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (!world.grid.get(x, y)) {
      world.grid.set(x, y, new Creature(150, Tape.random(GENOME_LENGTH), Math.random(), [100, 200, 100, 255]));
    }
    if (i % 10_000 === 0) {
      renderProgress();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
};
