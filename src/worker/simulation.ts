import { WORLD_HEIGHT, WORLD_WIDTH } from "@/shared/constants";
import type { ViewMode } from "@/shared/types";
import type { SelectedItemData, WorldData } from "@/shared/worker-protocol";
import init, { Simulation as WasmSimulation } from "../../crates/hexolution-sim/pkg/hexolution_sim.js";

type SimulationEvents = {
  onData: (data: WorldData) => void;
  onSelectedItemUpdate: (item: SelectedItemData | null) => void;
  onSpeedChanged: (speed: number) => void;
};

export class Simulation {
  private readonly events: SimulationEvents;
  private wasm: WasmSimulation | null = null;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private dataDirty = false;
  private uiReadyForData = true;
  private backpressureEnabled = false;
  private pendingData: WorldData | null = null;
  private pendingSelected: SelectedItemData | null = null;
  private speedMultiplier = 1;

  constructor(events: SimulationEvents) {
    this.events = events;
  }

  async init() {
    await init();
    this.wasm = new WasmSimulation(WORLD_WIDTH, WORLD_HEIGHT);
    this.speedMultiplier = this.wasm.getSpeed();
    this.flushFromWasm();
    this.loop();
  }

  selectItem(...params: [number, number] | []) {
    if (!this.wasm) return;
    if (!params.length) {
      this.wasm.selectItem(undefined, undefined);
    } else {
      this.wasm.selectItem(params[0], params[1]);
    }
    this.pendingSelected = this.wasm.getSelectedItem() as SelectedItemData | null;
    this.events.onSelectedItemUpdate(this.pendingSelected);
  }

  setSpeed(speed: number) {
    this.speedMultiplier = speed;
    this.wasm?.setSpeed(speed);
    this.events.onSpeedChanged(speed);
    if (speed > 0) this.scheduleLoop();
  }

  getSpeed() {
    return this.wasm?.getSpeed() ?? this.speedMultiplier;
  }

  setViewMode(mode: ViewMode) {
    this.wasm?.setViewMode(mode);
    this.flushFromWasm();
  }

  getLatestFrame() {
    if (!this.wasm) return null;
    const frame = this.wasm.getLatestFrame() as {
      buffer: ArrayBuffer;
      width: number;
      height: number;
    };
    return frame;
  }

  ackData() {
    this.backpressureEnabled = true;
    this.uiReadyForData = true;
    this.flushDataIfReady();
  }

  getObjectAt({ x, y }: { x: number; y: number }) {
    if (!this.wasm) return null;
    return this.wasm.getObjectAt(x, y) as { type: string; color: [number, number, number, number] } | null;
  }

  private loop = () => {
    if (!this.wasm || this.speedMultiplier <= 0) return;
    this.wasm.tick();
    this.flushFromWasm();
    this.scheduleLoop();
  };

  private flushFromWasm() {
    if (!this.wasm) return;
    this.pendingData = this.wasm.getWorldData() as WorldData;
    this.pendingSelected = this.wasm.getSelectedItem() as SelectedItemData | null;
    this.dataDirty = true;
    this.flushDataIfReady();
  }

  private flushDataIfReady() {
    if (!this.dataDirty || !this.pendingData) return;
    if (this.backpressureEnabled && !this.uiReadyForData) return;

    this.dataDirty = false;
    if (this.backpressureEnabled) this.uiReadyForData = false;

    this.events.onData(this.pendingData);
    this.events.onSelectedItemUpdate(this.pendingSelected);
  }

  private scheduleLoop() {
    if (this.loopTimer !== null) return;
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this.loop();
    }, 0);
  }
}
