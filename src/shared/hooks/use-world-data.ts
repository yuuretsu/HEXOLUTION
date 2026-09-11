import { useEffect, useState } from "react";
import { workerApi } from "@/shared/worker-client";
import type { WorldData } from "@/shared/worker-protocol";

export type ChartData = {
  creatures: [number, number][];
  organic: [number, number][];
};

const initialWorldData: WorldData = {
  worldEnergy: 0,
  creaturesEnergy: 0,
  organicEnergy: 0,
  worldEntries: [],
  worldAge: 0,
  worldSize: { width: 0, height: 0 },
};

export const useWorldData = () => {
  const [data, setData] = useState<WorldData>(initialWorldData);
  const [chartData, setChartData] = useState<ChartData>({ creatures: [], organic: [] });

  useEffect(() => {
    let isActive = true;

    void workerApi.call("ackData", []);

    const unsubscribe = workerApi.on("data", (nextData) => {
      if (!isActive) {
        void workerApi.call("ackData", []);
        return;
      }

      setData(nextData);
      const creatures: [number, number] = [
        nextData.worldAge,
        nextData.worldEntries.find(([name]) => name === "Creature")?.[1] ?? 0,
      ];
      const organic: [number, number] = [
        nextData.worldAge,
        nextData.worldEntries.find(([name]) => name === "Organic")?.[1] ?? 0,
      ];
      setChartData((previousData) => ({
        creatures: [...previousData.creatures, creatures].slice(-1000),
        organic: [...previousData.organic, organic].slice(-1000),
      }));

      void workerApi.call("ackData", []);
    });

    return () => {
      isActive = false;
      unsubscribe();
      void workerApi.call("ackData", []);
    };
  }, []);

  return [data, chartData] as const;
};
