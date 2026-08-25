import { useEffect, useState } from "react";
import { workerApi } from "@/shared/worker-client";
import type { WorldData } from "@/shared/worker-protocol";
import { CellType } from "@/simulation/clans/cell-types";

export type ChartData = {
  living: [number, number][];
  leaf: [number, number][];
  wood: [number, number][];
  apex: [number, number][];
};

const initialWorldData: WorldData = {
  organicSoil: 0,
  energySoil: 0,
  organicPoison: 0,
  energyPoison: 0,
  mutations: 0,
  livingCells: 0,
  typeCounts: [],
  worldAge: 0,
  worldSize: { width: 0, height: 0 },
};

export const useWorldData = () => {
  const [data, setData] = useState<WorldData>(initialWorldData);
  const [chartData, setChartData] = useState<ChartData>({
    living: [],
    leaf: [],
    wood: [],
    apex: [],
  });

  useEffect(() => {
    let active = true;

    void workerApi.call("ackData", []);

    const unsubscribe = workerApi.on("data", (nextData) => {
      if (!active) {
        void workerApi.call("ackData", []);
        return;
      }

      setData(nextData);
      const age = nextData.worldAge;
      const counts = nextData.typeCounts ?? [];
      setChartData((previousData) => ({
        living: [...previousData.living, [age, nextData.livingCells] as [number, number]].slice(-800),
        apex: [...previousData.apex, [age, counts[CellType.Apex] ?? 0] as [number, number]].slice(-800),
        leaf: [...previousData.leaf, [age, counts[CellType.Leaf] ?? 0] as [number, number]].slice(-800),
        wood: [...previousData.wood, [age, counts[CellType.Wood] ?? 0] as [number, number]].slice(-800),
      }));

      void workerApi.call("ackData", []);
    });

    return () => {
      active = false;
      unsubscribe();
      void workerApi.call("ackData", []);
    };
  }, []);

  return [data, chartData] as const;
};
