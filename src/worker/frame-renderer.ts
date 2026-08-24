import type { ViewMode } from "shared/types";
import { Counter } from "shared/utils/counter";
import type { World, WorldItem } from "simulation/world";

const getColor = (item: WorldItem, mode: ViewMode) => {
  switch (mode) {
    case "normal": return item.getColor();
    case "energy": return item.getEnergyColor();
    case "genome-hash": return item.getGenomeHashColor();
    case "coloration": return item.getColoration();
    default: return [255, 0, 255, 255];
  }
};

export class FrameRenderer {
  private readonly world: World;
  private readonly pixelBuffer: Uint8ClampedArray;
  private readonly pixelView: Uint32Array;

  constructor(world: World) {
    this.world = world;
    this.pixelBuffer = new Uint8ClampedArray(world.grid.width * world.grid.height * 4);
    this.pixelView = new Uint32Array(this.pixelBuffer.buffer);
  }

  render(viewMode: ViewMode) {
    const entries = new Counter<string>();
    let creaturesEnergy = 0;
    let foodEnergy = 0;
    const { width, height } = this.world.grid;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const item = this.world.grid.get(x, y);
        const index = y * width + x;
        if (!item) {
          entries.add("Empty");
          this.pixelView[index] = 0;
          continue;
        }
        entries.add(item.CLASS_NAME);
        const color = getColor(item, viewMode);
        this.pixelView[index] = (255 << 24) | (color[2] << 16) | (color[1] << 8) | color[0];
        if ("energy" in item && typeof item.energy === "number") {
          if (item.CLASS_NAME === "Creature") creaturesEnergy += item.energy;
          else if (item.CLASS_NAME === "Food") foodEnergy += item.energy;
        }
      }
    }
    return { entries, creaturesEnergy, foodEnergy };
  }

  getFrame() {
    return { buffer: new Uint8ClampedArray(this.pixelBuffer).buffer, width: this.world.grid.width, height: this.world.grid.height };
  }
}
