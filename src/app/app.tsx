import { useState, type FC } from "react";
import { WorldImage } from "components/world-image";
import { workerApi } from "app/worker-client";
import { AppControls } from "./components/app-controls";
import { Sidebar } from "./components/sidebar";
import { useWorldData } from "./hooks/use-world-data";

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
