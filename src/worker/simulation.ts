import { WORLD_HEIGHT, WORLD_WIDTH } from "shared/constants";
import type { ViewMode } from "shared/types";
import type { WorldData } from "shared/worker-protocol";
import { World, WorldItemDynamic, type WorldItem } from "simulation/world";
import { FrameRenderer } from "./frame-renderer";
import { serializeSelectedItem } from "./selected-item";
import { populateWorld } from "./world-generator";

type SimulationEvents = {
  onData: (data: WorldData) => void;
  onSelectedItemUpdate: (item: ReturnType<typeof serializeSelectedItem>) => void;
  onSpeedChanged: (speed: number) => void;
};

export class Simulation {
  private readonly events: SimulationEvents;
  private readonly world = new World(WORLD_WIDTH, WORLD_HEIGHT);
  private readonly renderer = new FrameRenderer(this.world);
  private speedMultiplier = 1;
  private viewMode: ViewMode = "normal";
  private selectedItem: WorldItem | null = null;
  private age = 0;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private pendingData: WorldData | null = null;
  private dataDirty = false;
  private uiReadyForData = true;
  private backpressureEnabled = false;

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
    if (speed > 0) this.scheduleLoop();
  }

  getSpeed() { return this.speedMultiplier; }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    this.render();
  }

  getLatestFrame() { return this.renderer.getFrame(); }

  ackData() {
    this.backpressureEnabled = true;
    this.uiReadyForData = true;
    this.flushDataIfReady();
  }

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
    this.scheduleLoop();
  };

  private render() {
    const { entries, creaturesEnergy, foodEnergy } = this.renderer.render(this.viewMode);
    this.pendingData = {
      worldEnergy: this.world.energy,
      creaturesEnergy,
      foodEnergy,
      worldAge: this.age,
      worldSize: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      worldEntries: entries.getMostCommon(5),
    };
    this.dataDirty = true;
    this.flushDataIfReady();
  }

  private flushDataIfReady() {
    if (!this.dataDirty || !this.pendingData) return;
    if (this.backpressureEnabled && !this.uiReadyForData) return;

    this.dataDirty = false;
    if (this.backpressureEnabled) this.uiReadyForData = false;

    this.events.onData(this.pendingData);
    this.emitSelectedItemUpdate();
  }

  private emitSelectedItemUpdate() {
    this.events.onSelectedItemUpdate(serializeSelectedItem(this.selectedItem));
  }

  private scheduleLoop() {
    if (this.loopTimer !== null) return;
    this.loopTimer = setTimeout(() => { this.loopTimer = null; this.loop(); }, 0);
  }
}
