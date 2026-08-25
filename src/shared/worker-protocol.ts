import type { Rgba, ViewMode } from "./types";

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
  organicSoil: number;
  energySoil: number;
  organicPoison: number;
  energyPoison: number;
  mutations: number;
  livingCells: number;
  worldAge: number;
  worldSize: { width: number; height: number };
  typeCounts: number[];
};

export type WorkerApiEvents = {
  data: WorldData;
  selectedItemUpdate: SelectedItemData | null;
  speedChanged: number;
};

export type SelectedItemData = {
  type: string;
  color: Rgba;
  cellType?: number;
  energy?: number;
  age?: number;
  level?: number;
  activeGene?: number;
  clanId?: number;
  direction?: number;
  parent?: number;
  genomeIndex?: number;
  geneBytes?: number[];
  organicHere?: number;
  energyHere?: number;
};
