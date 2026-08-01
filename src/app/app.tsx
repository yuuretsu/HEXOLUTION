import { useState, type FC } from "react";
import { WorldImage } from "widgets/world-image";
import { useWorldData } from "../shared/hooks/use-world-data";
import { AppControls } from "widgets/app-controls";
import { Sidebar } from "widgets/sidebar";
import { workerApi } from "shared/worker-client";

export const App: FC = () => {
  const [data, chartData] = useWorldData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <WorldImage
        onClickPixel={async (x, y) => workerApi.call("selectItem", [x, y])}
        isTouchpadMode={localStorage.getItem("controlMode") === "touchpad"}
      />
      <Sidebar data={data} chartData={chartData} isOpen={isSidebarOpen} />
      <AppControls onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)} />
    </>
  );
};
