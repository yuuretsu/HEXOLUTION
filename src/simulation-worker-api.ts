import type { Rgba, ViewMode } from "types";
import { WorkerClient } from "utils/worker-api";

export type Api = {
  selectItem: [x: number, y: number] | [],
  setViewMode: [mode: ViewMode],
  setSpeed: [speed: number],
  getSpeed: [],
  getLatestFrame: [],
  getObjectAt: [{ x: number, y: number }],
};

export type ApiResults = {
  selectItem: void,
  setViewMode: void,
  setSpeed: void,
  getSpeed: number,
  getLatestFrame: { buffer: ArrayBuffer, width: number, height: number } | null,
  getObjectAt: { type: string, color: Rgba } | null,
}

export type WorldData = {
  worldEnergy: number,
  itemsEnergy: number,
  worldAge: number,
  worldEntries: [string, number][],
}

export type ApiEvents = {
  data: WorldData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedItemUpdate: any;
  speedChanged: number;
};

export const workerApi = new WorkerClient<Api, ApiResults, ApiEvents>(
  new Worker(new URL('./simulation-worker.ts', import.meta.url), { type: 'module' })
);

workerApi.listen();