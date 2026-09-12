import { Counter } from "@/shared/utils/counter";
import { base4toInt } from "@/shared/utils";
import { Creature } from "@/simulation/creature/creature";
import { GENE_HANDLERS } from "@/simulation/creature/gene-library";
import { Organic } from "@/simulation/organic";
import { Stone } from "@/simulation/stone";
import type { World, WorldItem } from "@/simulation/world";
import {
  CellKind,
  clearCell,
  GRID_CELL_STRIDE,
  GRID_LAYOUT_VERSION,
  LAST_GENE_NONE,
  writeCell,
} from "./grid-layout";
import type { GridBufferMeta } from "./types";

const POOL_LIMIT = 2;

export type PublishStats = {
  worldEnergy: number;
  creaturesEnergy: number;
  organicEnergy: number;
  worldAge: number;
  worldSize: { width: number; height: number };
  worldEntries: [string, number][];
};

export type PublishResult = {
  meta: GridBufferMeta;
  stats: PublishStats;
  selectedItem: WorldItem | null;
};

const resolveLastGene = (creature: Creature): number => {
  const geneIndex = creature.activeGeneIndices.at(-1);
  if (geneIndex === undefined) return LAST_GENE_NONE;
  const offset = geneIndex * 3;
  const n = base4toInt(
    creature.tape.data[offset],
    creature.tape.data[offset + 1],
    creature.tape.data[offset + 2],
  );
  return n % GENE_HANDLERS.length;
};

const accumulateEnergy = (
  item: WorldItem,
  energy: { creatures: number; organic: number },
) => {
  if (!("energy" in item) || typeof item.energy !== "number") return;
  if (item.CLASS_NAME === "Creature") energy.creatures += item.energy;
  else if (item.CLASS_NAME === "Organic") energy.organic += item.energy;
};

export class GridPublisher {
  private readonly world: World;
  private readonly byteLength: number;
  private readonly freeBuffers: ArrayBuffer[] = [];
  private activeBuffer: ArrayBuffer;
  private activeView: DataView;
  private hasUnread = false;
  private generation = 0;

  constructor(world: World) {
    this.world = world;
    this.byteLength = world.grid.width * world.grid.height * GRID_CELL_STRIDE;
    this.activeBuffer = new ArrayBuffer(this.byteLength);
    this.freeBuffers.push(new ArrayBuffer(this.byteLength));
    this.activeView = new DataView(this.activeBuffer);
  }

  publish(selectedId: number, worldAge: number): PublishResult {
    const entries = new Counter<string>();
    const energy = { creatures: 0, organic: 0 };
    let selectedItem: WorldItem | null = null;
    const { width, height } = this.world.grid;
    const view = this.activeView;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const item = this.world.grid.get(x, y);
        const index = y * width + x;

        if (!item) {
          entries.add("Empty");
          clearCell(view, index);
          continue;
        }

        if (selectedId !== 0 && item.id === selectedId) selectedItem = item;
        entries.add(item.CLASS_NAME);
        accumulateEnergy(item, energy);
        this.writeItem(view, index, item);
      }
    }

    this.generation += 1;
    this.hasUnread = true;

    return {
      meta: {
        buffer: this.activeBuffer,
        width,
        height,
        stride: GRID_CELL_STRIDE,
        generation: this.generation,
        layoutVersion: GRID_LAYOUT_VERSION,
      },
      stats: {
        worldEnergy: this.world.energy,
        creaturesEnergy: energy.creatures,
        organicEnergy: energy.organic,
        worldAge,
        worldSize: { width, height },
        worldEntries: entries.getMostCommon(5),
      },
      selectedItem,
    };
  }

  getLatest(): GridBufferMeta | null {
    if (!this.hasUnread) return null;

    this.hasUnread = false;
    const buffer = this.activeBuffer;
    const width = this.world.grid.width;
    const height = this.world.grid.height;
    const generation = this.generation;

    const next = this.freeBuffers.pop() ?? new ArrayBuffer(this.byteLength);
    this.activeBuffer = next;
    this.activeView = new DataView(next);

    return {
      buffer,
      width,
      height,
      stride: GRID_CELL_STRIDE,
      generation,
      layoutVersion: GRID_LAYOUT_VERSION,
    };
  }

  returnBuffer(buffer: ArrayBuffer) {
    if (buffer.byteLength !== this.byteLength) return;
    if (this.freeBuffers.length >= POOL_LIMIT) return;
    this.freeBuffers.push(buffer);
  }

  private writeItem(view: DataView, index: number, item: WorldItem) {
    if (item instanceof Creature) {
      writeCell(view, index, {
        kind: CellKind.Creature,
        lastGene: resolveLastGene(item),
        energy: Math.max(0, Math.min(0xffff, Math.floor(item.energy))),
        display: [item.color[0], item.color[1], item.color[2]],
        coloration: [item.coloration[0], item.coloration[1], item.coloration[2]],
        genomeHash: [
          item.genomeHashColor[0],
          item.genomeHashColor[1],
          item.genomeHashColor[2],
        ],
      });
      return;
    }

    if (item instanceof Organic) {
      writeCell(view, index, {
        kind: CellKind.Organic,
        lastGene: LAST_GENE_NONE,
        energy: Math.max(0, Math.min(0xffff, Math.floor(item.energy))),
        display: [0, 0, 0],
        coloration: [0, 0, 0],
        genomeHash: [0, 0, 0],
      });
      return;
    }

    if (item instanceof Stone) {
      writeCell(view, index, {
        kind: CellKind.Stone,
        lastGene: LAST_GENE_NONE,
        energy: 0,
        display: [item.color[0], item.color[1], item.color[2]],
        coloration: [0, 0, 0],
        genomeHash: [0, 0, 0],
      });
      return;
    }

    clearCell(view, index);
  }
}
