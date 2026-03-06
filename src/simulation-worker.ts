import { GENOME_LENGTH, HEX_ASPECT } from "./constants";
import { Creature } from "./creature";
import { Stone } from "./stone";
import { Tape } from "./tape";
import { World, WorldItemDynamic, type WorldItem } from "./world";
import { WorkerServer } from "./utils/worker-api";
import type { Api, ApiEvents, ApiResults } from "./simulation-worker-api";
import { Counter } from "./utils/counter";
import { roundToEven } from "./utils";
import type { ViewMode } from "./types";
import type { IGrid } from "./utils/grid";

export const fillCircle = <T>(
  grid: IGrid<T>,
  sx: number,
  sy: number,
  sr: number,
  value?: (x: number, y: number) => T | undefined
) => {
  const HEX_ASPECT = 0.866;
  const w = grid.width;
  const h = grid.height;
  const rSq = sr * sr;
  const rCeilY = Math.floor(sr / HEX_ASPECT);
  const startX = Math.floor(sx);
  const startY = Math.floor(sy);

  for (let iy = -rCeilY; iy <= rCeilY; iy++) {
    const dy = iy * HEX_ASPECT;
    const dySq = dy * dy;
    const maxDX = Math.sqrt(rSq - dySq);
    const rX = Math.floor(maxDX);
    const worldY = (((startY + iy) % h) + h) % h;
    for (let ix = -rX; ix <= rX; ix++) {
      const worldX = (((startX + ix) % w) + w) % w;
      grid.set(worldX, worldY, value?.(worldX, worldY));
    }
  }
};

const W_COUNT = 200;
const H_COUNT = roundToEven(W_COUNT / HEX_ASPECT);
const world = new World(W_COUNT, H_COUNT);
const w = world.grid.width;
const h = world.grid.height;

let speedMultiplier = 1;
let viewMode: ViewMode = "normal";
let selectedItem: null | WorldItem = null;
let age = 0;

const pixelBuffer = new Uint8ClampedArray(w * h * 4);
const pixelView = new Uint32Array(pixelBuffer.buffer);

const getColor = (item: WorldItem, mode: ViewMode) => {
  switch (mode) {
    case "normal": return item.getColor();
    case "energy": return item.getEnergyColor();
    case "genome-hash": return item.getGenomeHashColor();
    default: return [255, 0, 255, 255];
  }
};

const renderToBuffer = () => {
  const counter = new Counter<string>();
  let itemsEnergy = 0;

  for (let y = 0; y < h; y++) {
    const rowOffset = y * w;
    for (let x = 0; x < w; x++) {
      const item = world.grid.get(x, y);
      if (item) {
        counter.add(item.CLASS_NAME);
        const c = getColor(item, viewMode);
        pixelView[rowOffset + x] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
        if ("energy" in item && typeof item.energy === "number") {
          itemsEnergy += item.energy;
        }
      } else {
        counter.add("Empty");
        pixelView[rowOffset + x] = 0x00000000;
      }
    }
  }
  return { counter, itemsEnergy };
};

const server = new WorkerServer<Api, ApiResults, ApiEvents>(self, {
  selectItem(...params) {
    if (!params.length) return (selectedItem = null);
    const [x, y] = params;
    selectedItem = world.grid.get(Math.floor(x), Math.floor(y)) || null;
  },
  setSpeed(speed: number) {
    speedMultiplier = speed;
    server.emit("speedChanged", speed);
  },
  getSpeed() { return speedMultiplier; },
  setViewMode(mode: ViewMode) { viewMode = mode; renderToBuffer(); },
  getLatestFrame() {
    return { buffer: new Uint8ClampedArray(pixelBuffer).buffer, width: w, height: h };
  },
  getObjectAt({ x, y }: { x: number, y: number }) {
    const item = world.grid.get(Math.floor(x), Math.floor(y));
    return item ? { type: item.constructor.name, color: item.getColor() } : null;
  }
});

const loop = () => {
  const totalCells = w * h;
  const iterations = totalCells * speedMultiplier;

  for (let i = 0; i < iterations; i++) {
    const rx = ~~(Math.random() * w);
    const ry = ~~(Math.random() * h);
    const item = world.grid.get(rx, ry);
    age++;
    if (item instanceof WorldItemDynamic) {
      item.process(world, rx, ry);
    }
  }

  const { counter, itemsEnergy } = renderToBuffer();

  server.emit("data", {
    worldEnergy: world.energy,
    itemsEnergy,
    worldAge: age,
    worldSize: { width: W_COUNT, height: H_COUNT },
    worldEntries: counter.getMostCommon(5)
  });

  if (selectedItem) {
    const commonData = { type: selectedItem.CLASS_NAME, color: selectedItem.getColor() };
    if (selectedItem instanceof Creature) {
      server.emit("selectedItemUpdate", {
        ...commonData,
        direction: selectedItem.direction,
        program: [...selectedItem.tape.data],
        pointer: selectedItem.tape.pointer,
        age: selectedItem.age,
        energy: selectedItem.energy,
      });
    } else {
      server.emit("selectedItemUpdate", commonData);
    }
  }

  setTimeout(loop, 10);
};

const init = async () => {
  // Генерация камней
  for (let i = 0; i < 25; i++) {
    const rx = ~~(Math.random() * w);
    const ry = ~~(Math.random() * h);
    const r = Math.random() ** 20 * 50 + 50;
    fillCircle(world.grid, rx, ry, r, () => new Stone());
    const angle = Math.random() * Math.PI * 2;
    const dist = r * 0.2;
    fillCircle(world.grid, rx + dist * Math.cos(angle), ry + dist * Math.sin(angle), r * 0.9);

    if (i % 1 === 0) {
      renderToBuffer();
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // Генерация существ
  for (let i = 0; i < 100000; i++) {
    const x = ~~(Math.random() * w);
    const y = ~~(Math.random() * h);
    if (!world.grid.get(x, y)) {
      world.grid.set(x, y, new Creature(150, Tape.random(GENOME_LENGTH), Math.random(), [100, 200, 100, 255]));
    }

    if (i % 10000 === 0) {
      renderToBuffer();
      await new Promise(r => setTimeout(r, 0));
    }
  }

  loop();
};

init();
