import { useState, type FC } from "react";
import { WorldImage } from "@/widgets/world-image";
import { WorldDataProvider } from "@/shared/hooks/world-data-provider";
import { AppControls } from "@/widgets/app-controls";
import { Sidebar } from "@/widgets/sidebar";
import { workerApi } from "@/shared/worker-client";

export const App: FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <WorldDataProvider>
      <WorldImage
        onClickPixel={async (x, y) => workerApi.call("selectItem", [x, y])}
        isTouchpadMode={localStorage.getItem("controlMode") === "touchpad"}
      />
      <Sidebar isOpen={isSidebarOpen} />
      <AppControls onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)} />
    </WorldDataProvider>
  );
};
