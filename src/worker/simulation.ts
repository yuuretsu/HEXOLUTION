import { HEX_ASPECT } from "shared/constants";
import type { ViewMode } from "shared/types";
import type { WorldData } from "shared/worker-protocol";
import { roundToEven } from "shared/utils";
import { World, WorldItemDynamic, type WorldItem } from "simulation/world";
import { FrameRenderer } from "./frame-renderer";
import { serializeSelectedItem } from "./selected-item";
import { populateWorld } from "./world-generator";

const worldWidth = 128;
const worldHeight = roundToEven(worldWidth / HEX_ASPECT);

type SimulationEvents = {
  onData: (data: WorldData) => void;
  onSelectedItemUpdate: (item: ReturnType<typeof serializeSelectedItem>) => void;
  onSpeedChanged: (speed: number) => void;
};

export class Simulation {
  private readonly events: SimulationEvents;
  private readonly world = new World(worldWidth, worldHeight);
  private readonly renderer = new FrameRenderer(this.world);
  private speedMultiplier = 1;
  private viewMode: ViewMode = "normal";
  private selectedItem: WorldItem | null = null;
  private age = 0;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(events: SimulationEvents) {
    this.events = events;
  }

  async init() {
    await populateWorld(this.world, () => this.render());
    this.loop();
  }

  selectItem(...params: [number, number] | []) {
    this.selectedItem = params.length ? this.world.grid.get(Math.floor(params[0]), Math.floor(params[1])) ?? null : null;
    this.emitSelectedItemUpdate();
  }

  setSpeed(speed: number) {
    this.speedMultiplier = speed;
    this.events.onSpeedChanged(speed);
    if (speed > 0) this.scheduleLoop(0);
  }

  getSpeed() { return this.speedMultiplier; }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    this.render();
  }

  getLatestFrame() { return this.renderer.getFrame(); }

  getObjectAt({ x, y }: { x: number; y: number }) {
    const item = this.world.grid.get(Math.floor(x), Math.floor(y));
    return item ? { type: item.constructor.name, color: item.getColor() } : null;
  }

  private loop = () => {
    if (this.speedMultiplier <= 0) return;
    const { width, height } = this.world.grid;
    for (let i = 0; i < width * height * this.speedMultiplier; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      this.age++;
      const item = this.world.grid.get(x, y);
      if (item instanceof WorldItemDynamic) item.process(this.world, x, y);
    }
    this.render();
    this.emitSelectedItemUpdate();
    this.scheduleLoop();
  };

  private render() {
    const { entries, itemsEnergy } = this.renderer.render(this.viewMode);
    this.events.onData({ worldEnergy: this.world.energy, itemsEnergy, worldAge: this.age, worldSize: { width: worldWidth, height: worldHeight }, worldEntries: entries.getMostCommon(5) });
  }

  private emitSelectedItemUpdate() {
    this.events.onSelectedItemUpdate(serializeSelectedItem(this.selectedItem));
  }

  private scheduleLoop(delay = 10) {
    if (this.loopTimer !== null) return;
    this.loopTimer = setTimeout(() => { this.loopTimer = null; this.loop(); }, delay);
  }
}
