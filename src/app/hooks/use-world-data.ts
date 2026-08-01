import { useEffect, useState } from "react";
import { workerApi, type WorldData } from "simulation-worker-api";

export type ChartData = {
  creatures: [number, number][];
  food: [number, number][];
};

const initialWorldData: WorldData = {
  worldEnergy: 0,
  itemsEnergy: 0,
  worldEntries: [],
  worldAge: 0,
  worldSize: { width: 0, height: 0 },
};

export const useWorldData = () => {
  const [data, setData] = useState<WorldData>(initialWorldData);
  const [chartData, setChartData] = useState<ChartData>({ creatures: [], food: [] });

  useEffect(() => {
    return workerApi.on("data", (nextData) => {
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
    });
  }, []);

  return [data, chartData] as const;
};
