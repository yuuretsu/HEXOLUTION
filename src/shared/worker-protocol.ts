import type { Rgba } from "@/shared/types";
import type { GeneMeta, GridBufferMeta } from "@/simulation/api/types";

export type WorkerApi = {
  selectItem: [x: number, y: number] | [];
  setSpeed: [speed: number];
  getSpeed: [];
  getLatestGrid: [];
  returnGrid: [buffer: ArrayBuffer];
  getObjectAt: [{ x: number; y: number }];
  ackStats: [];
  getGeneMeta: [];
};

export type WorkerApiResults = {
  selectItem: void;
  setSpeed: void;
  getSpeed: number;
  getLatestGrid: GridBufferMeta | null;
  returnGrid: void;
  getObjectAt: { type: string; color: Rgba } | null;
  ackStats: void;
  getGeneMeta: GeneMeta[];
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
  stats: WorldData;
  selection: SelectedItemData | null;
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
