import type { ViewMode } from "@/shared/types";
import { Counter } from "@/shared/utils/counter";
import type { World, WorldItem } from "@/simulation/world";

const getColor = (item: WorldItem, mode: ViewMode) => {
  switch (mode) {
    case "normal": return item.getColor();
    case "energy": return item.getEnergyColor();
    case "genome-hash": return item.getGenomeHashColor();
    case "coloration": return item.getColoration();
    case "last-action": return item.getLastActionColor();
    default: return [255, 0, 255, 255];
  }
};

const POOL_LIMIT = 2;

export class FrameRenderer {
  private readonly world: World;
  private readonly byteLength: number;
  private readonly freeBuffers: ArrayBuffer[] = [];
  private activeBuffer: ArrayBuffer;
  private pixelView: Uint32Array;
  private hasUnreadFrame = false;

  constructor(world: World) {
    this.world = world;
    this.byteLength = world.grid.width * world.grid.height * 4;
    this.activeBuffer = new ArrayBuffer(this.byteLength);
    this.freeBuffers.push(new ArrayBuffer(this.byteLength));
    this.pixelView = new Uint32Array(this.activeBuffer);
  }

  render(viewMode: ViewMode, selectedId = 0) {
    const entries = new Counter<string>();
    let creaturesEnergy = 0;
    let organicEnergy = 0;
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
        entries.add(item.CLASS_NAME);
        const color = getColor(item, viewMode);
        this.pixelView[index] = (255 << 24) | (color[2] << 16) | (color[1] << 8) | color[0];
        if ("energy" in item && typeof item.energy === "number") {
          if (item.CLASS_NAME === "Creature") creaturesEnergy += item.energy;
          else if (item.CLASS_NAME === "Organic") organicEnergy += item.energy;
        }
      }
    }
    this.hasUnreadFrame = true;
    return { entries, creaturesEnergy, organicEnergy, selectedItem };
  }

  getFrame() {
    if (!this.hasUnreadFrame) return null;

    this.hasUnreadFrame = false;
    const buffer = this.activeBuffer;
    const next = this.freeBuffers.pop() ?? new ArrayBuffer(this.byteLength);
    this.activeBuffer = next;
    this.pixelView = new Uint32Array(next);

    return { buffer, width: this.world.grid.width, height: this.world.grid.height };
  }

  returnFrame(buffer: ArrayBuffer) {
    if (buffer.byteLength !== this.byteLength) return;
    if (this.freeBuffers.length >= POOL_LIMIT) return;
    this.freeBuffers.push(buffer);
  }
}
