import { EntityKind } from "@/simulation/entity-kind";
import type { IEnergyHolder } from "@/simulation/interfaces";
import type { ViewMode } from "@/shared/types";
import { Counter } from "@/shared/utils/counter";
import type { World, WorldItem } from "@/simulation/world";

const resolveColor = (item: WorldItem, mode: ViewMode) => {
  switch (mode) {
    case "normal": return item.getColor();
    case "energy": return item.getEnergyColor();
    case "genome-hash": return item.getGenomeHashColor();
    case "coloration": return item.getColoration();
    default: return [255, 0, 255, 255] as const;
  }
};

const isEnergyHolder = (item: WorldItem): item is WorldItem & IEnergyHolder =>
  "energy" in item && typeof (item as IEnergyHolder).energy === "number";

export class FrameRenderer {
  private readonly pixelBuffer: Uint8ClampedArray;
  private readonly pixelView: Uint32Array;
  private readonly world: World;

  constructor(world: World) {
    this.world = world;
    this.pixelBuffer = new Uint8ClampedArray(world.grid.width * world.grid.height * 4);
    this.pixelView = new Uint32Array(this.pixelBuffer.buffer);
  }

  render(viewMode: ViewMode, selectedId = 0) {
    const entries = new Counter<string>();
    let creaturesEnergy = 0;
    let foodEnergy = 0;
    let selectedItem: WorldItem | null = null;
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
        if (selectedId !== 0 && item.id === selectedId) selectedItem = item;
        entries.add(item.kind);
        const color = resolveColor(item, viewMode);
        this.pixelView[index] = (255 << 24) | (color[2] << 16) | (color[1] << 8) | color[0];
        if (isEnergyHolder(item)) {
          if (item.kind === EntityKind.Creature) creaturesEnergy += item.energy;
          else if (item.kind === EntityKind.Food) foodEnergy += item.energy;
        }
      }
    }
    return { entries, creaturesEnergy, foodEnergy, selectedItem };
  }

  getFrame() {
    return {
      buffer: new Uint8ClampedArray(this.pixelBuffer).buffer,
      width: this.world.grid.width,
      height: this.world.grid.height,
    };
  }
}
