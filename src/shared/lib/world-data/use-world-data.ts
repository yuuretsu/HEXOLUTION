import { createContext, useContext } from "react";
import type { WorldData } from "@/shared/api";

export type ChartData = {
  creatures: [number, number][];
  organic: [number, number][];
};

export type WorldDataContextValue = {
  data: WorldData;
  chartData: ChartData;
};

export const WorldDataContext = createContext<WorldDataContextValue | null>(null);

export const useWorldData = () => {
  const value = useContext(WorldDataContext);
  if (!value) {
    throw new Error("useWorldData must be used within WorldDataProvider");
  }
  return value;
};
