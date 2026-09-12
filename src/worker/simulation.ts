import { INITIAL_SIMULATION_SPEED, WORLD_HEIGHT, WORLD_WIDTH } from "@/shared/constants";
import type { WorldData } from "@/shared/worker-protocol";
import {
  World,
  WorldItemDynamic,
  type WorldItem,
  GridPublisher,
  type GridBufferMeta,
} from "@hexolution/simulation";
import { serializeSelectedItem } from "./selected-item";
import { populateWorld } from "./world-generator";

type SimulationEvents = {
  onStats: (data: WorldData) => void;
  onSelection: (item: ReturnType<typeof serializeSelectedItem>) => void;
  onSpeedChanged: (speed: number) => void;
};

export class Simulation {
  private readonly events: SimulationEvents;
  private readonly world = new World(WORLD_WIDTH, WORLD_HEIGHT);
  private readonly publisher = new GridPublisher(this.world);
  private speedMultiplier = INITIAL_SIMULATION_SPEED;
  private selectedId = 0;
  private age = 0;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  private pendingData: WorldData | null = null;
  private pendingSelectedItem: WorldItem | null = null;
  private isDataDirty = false;
  private isUiReadyForData = true;
  private isBackpressureEnabled = false;

  constructor(events: SimulationEvents) {
    this.events = events;
  }

  async init() {
    await populateWorld(this.world, () => this.publish());
    this.publish();
    this.loop();
  }

  selectItem(...params: [number, number] | []) {
    if (!params.length) {
      this.selectedId = 0;
      this.pendingSelectedItem = null;
    } else {
      const item = this.world.grid.get(Math.floor(params[0]), Math.floor(params[1])) ?? null;
      this.selectedId = item?.id ?? 0;
      this.pendingSelectedItem = item;
    }
    this.events.onSelection(serializeSelectedItem(this.pendingSelectedItem));
  }

  setSpeed(speed: number) {
    this.speedMultiplier = speed;
    this.events.onSpeedChanged(speed);
    if (speed > 0) this.scheduleLoop();
  }

  getSpeed() { return this.speedMultiplier; }

  getLatestGrid(): GridBufferMeta | null {
    return this.publisher.getLatest();
  }

  returnGrid(buffer: ArrayBuffer) {
    this.publisher.returnBuffer(buffer);
  }

  ackStats() {
    this.isBackpressureEnabled = true;
    this.isUiReadyForData = true;
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
    this.publish();
    this.scheduleLoop();
  };

  private publish() {
    const { stats, selectedItem } = this.publisher.publish(this.selectedId, this.age);
    if (!selectedItem) this.selectedId = 0;
    this.pendingSelectedItem = selectedItem;
    this.pendingData = {
      worldEnergy: stats.worldEnergy,
      creaturesEnergy: stats.creaturesEnergy,
      organicEnergy: stats.organicEnergy,
      worldAge: stats.worldAge,
      worldSize: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      worldEntries: stats.worldEntries,
    };
    this.isDataDirty = true;
    this.flushDataIfReady();
  }

  private flushDataIfReady() {
    if (!this.isDataDirty || !this.pendingData) return;
    if (this.isBackpressureEnabled && !this.isUiReadyForData) return;

    this.isDataDirty = false;
    if (this.isBackpressureEnabled) this.isUiReadyForData = false;

    this.events.onStats(this.pendingData);
    this.events.onSelection(serializeSelectedItem(this.pendingSelectedItem));
  }

  private scheduleLoop() {
    if (this.loopTimer !== null) return;
    this.loopTimer = setTimeout(() => { this.loopTimer = null; this.loop(); }, 0);
  }
}
