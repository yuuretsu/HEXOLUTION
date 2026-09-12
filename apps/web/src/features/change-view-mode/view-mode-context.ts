import { createContext } from "react";
import type { ViewMode } from "@/shared/types";

export type ViewModeContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

export const ViewModeContext = createContext<ViewModeContextValue | null>(null);
