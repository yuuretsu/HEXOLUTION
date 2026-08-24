import { useEffect, useState } from "react";
import { workerApi } from "@/shared/worker-client";
import type { WorldData } from "@/shared/worker-protocol";

export type ChartData = {
  creatures: [number, number][];
  food: [number, number][];
};

const initialWorldData: WorldData = {
  worldEnergy: 0,
  creaturesEnergy: 0,
  foodEnergy: 0,
  worldEntries: [],
  worldAge: 0,
  worldSize: { width: 0, height: 0 },
};

export const useWorldData = () => {
  const [data, setData] = useState<WorldData>(initialWorldData);
  const [chartData, setChartData] = useState<ChartData>({ creatures: [], food: [] });

  useEffect(() => {
    let active = true;

    void workerApi.call("ackData", []);

    const unsubscribe = workerApi.on("data", (nextData) => {
      if (!active) {
        void workerApi.call("ackData", []);
        return;
      }

      setData(nextData);
      const creatures: [number, number] = [
        nextData.worldAge,
        nextData.worldEntries.find(([name]) => name === "Creature")?.[1] ?? 0,
      ];
      const food: [number, number] = [
        nextData.worldAge,
        nextData.worldEntries.find(([name]) => name === "Food")?.[1] ?? 0,
      ];
      setChartData((previousData) => ({
        creatures: [...previousData.creatures, creatures].slice(-1000),
        food: [...previousData.food, food].slice(-1000),
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
