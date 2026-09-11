import type { Rgba, ViewMode } from "@/shared/types";

export type WorkerApi = {
  selectItem: [x: number, y: number] | [];
  setViewMode: [mode: ViewMode];
  setSpeed: [speed: number];
  getSpeed: [];
  getLatestFrame: [];
  returnFrame: [buffer: ArrayBuffer];
  getObjectAt: [{ x: number, y: number }];
  ackData: [];
};

export type WorkerApiResults = {
  selectItem: void;
  setViewMode: void;
  setSpeed: void;
  getSpeed: number;
  getLatestFrame: { buffer: ArrayBuffer; width: number; height: number } | null;
  returnFrame: void;
  getObjectAt: { type: string; color: Rgba } | null;
  ackData: void;
};

export type WorldData = {
  worldEnergy: number;
  creaturesEnergy: number;
  organicEnergy: number;
  worldAge: number;
  worldSize: { width: number; height: number };
  worldEntries: [string, number][];
};

export type WorkerApiEvents = {
  data: WorldData;
  selectedItemUpdate: SelectedItemData | null;
  speedChanged: number;
};

export type SelectedCreatureData = {
  type: "Creature";
  color: Rgba;
  direction: number;
  program: number[];
  pointer: number;
  age: number;
  generation: number;
  energy: number;
  coloration: Rgba;
  activeGeneIndices: number[];
};

export type SelectedItemData =
  | SelectedCreatureData
  | {
      type: "Organic" | "Stone";
      color: Rgba;
    };
