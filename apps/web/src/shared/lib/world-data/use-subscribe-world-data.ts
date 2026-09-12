import { useEffect, useState } from "react";
import { workerApi, type WorldData } from "@/shared/api";
import type { ChartData } from "./use-world-data";

const initialWorldData: WorldData = {
  worldEnergy: 0,
  creaturesEnergy: 0,
  organicEnergy: 0,
  worldEntries: [],
  worldAge: 0,
  worldSize: { width: 0, height: 0 },
};

export const useSubscribeWorldData = () => {
  const [data, setData] = useState<WorldData>(initialWorldData);
  const [chartData, setChartData] = useState<ChartData>({ creatures: [], organic: [] });

  useEffect(() => {
    let isActive = true;

    void workerApi.call("ackStats", []);

    const unsubscribe = workerApi.on("stats", (nextData) => {
      if (!isActive) {
        void workerApi.call("ackStats", []);
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

      void workerApi.call("ackStats", []);
    });

    return () => {
      isActive = false;
      unsubscribe();
      void workerApi.call("ackStats", []);
    };
  }, []);

  return { data, chartData };
};
