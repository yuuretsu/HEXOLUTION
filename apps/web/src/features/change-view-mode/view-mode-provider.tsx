import { useState, type FC, type ReactNode } from "react";
import type { ViewMode } from "@/shared/types";
import { ViewModeContext } from "./view-mode-context";

export const ViewModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};
