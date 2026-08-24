import type { Rgba, ViewMode } from "shared/types";

export type WorkerApi = {
  selectItem: [x: number, y: number] | [];
  setViewMode: [mode: ViewMode];
  setSpeed: [speed: number];
  getSpeed: [];
  getLatestFrame: [];
  getObjectAt: [{ x: number, y: number }];
  ackData: [];
};

export type WorkerApiResults = {
  selectItem: void;
  setViewMode: void;
  setSpeed: void;
  getSpeed: number;
  getLatestFrame: { buffer: ArrayBuffer; width: number; height: number } | null;
  getObjectAt: { type: string; color: Rgba } | null;
  ackData: void;
};

export type WorldData = {
  worldEnergy: number;
  creaturesEnergy: number;
  foodEnergy: number;
  worldAge: number;
  worldSize: { width: number; height: number };
  worldEntries: [string, number][];
};

export type WorkerApiEvents = {
  data: WorldData;
  selectedItemUpdate: SelectedItemData | null;
  speedChanged: number;
};

export type SelectedItemData = {
  type: string;
  color: Rgba;
  direction?: number;
  program?: number[];
  pointer?: number;
  age?: number;
  energy?: number;
  coloration?: Rgba;
};
