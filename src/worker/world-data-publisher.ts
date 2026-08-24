import type { WorldData } from "@/shared/worker-protocol";

export class WorldDataPublisher {
  private pendingData: WorldData | null = null;
  private dataDirty = false;
  private uiReadyForData = true;
  private backpressureEnabled = false;
  private readonly onData: (data: WorldData) => void;
  private onFlushed: (() => void) | null = null;

  constructor(onData: (data: WorldData) => void) {
    this.onData = onData;
  }

  publish(data: WorldData, onFlushed?: () => void) {
    this.pendingData = data;
    this.dataDirty = true;
    this.onFlushed = onFlushed ?? null;
    this.flush();
  }

  ack() {
    this.backpressureEnabled = true;
    this.uiReadyForData = true;
    this.flush();
  }

  private flush() {
    if (!this.dataDirty || !this.pendingData) return;
    if (this.backpressureEnabled && !this.uiReadyForData) return;

    this.dataDirty = false;
    if (this.backpressureEnabled) this.uiReadyForData = false;
    this.onData(this.pendingData);
    this.onFlushed?.();
    this.onFlushed = null;
  }
}
