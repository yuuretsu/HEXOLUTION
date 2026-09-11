import { useState, type FC } from "react";
import { WorldImage } from "@/widgets/world-image";
import { useWorldData } from "../shared/hooks/use-world-data";
import { AppControls } from "@/widgets/app-controls";
import { Sidebar } from "@/widgets/sidebar";
import { workerApi } from "@/shared/worker-client";
import { readControlMode, type ControlMode } from "@/features/change-control-mode";

export const App: FC = () => {
  const [data, chartData] = useWorldData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [controlMode, setControlMode] = useState<ControlMode>(readControlMode);

  return (
    <>
      <WorldImage
        onClickPixel={(x, y) => { void workerApi.call("selectItem", [x, y]); }}
        isTouchpadMode={controlMode === "touchpad"}
      />
      <Sidebar
        data={data}
        chartData={chartData}
        isOpen={isSidebarOpen}
        controlMode={controlMode}
        onControlModeChange={setControlMode}
      />
      <AppControls onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)} />
    </>
  );
};
