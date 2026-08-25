import { useState } from "react";
import { workerApi } from "@/shared/worker-client";
import { Radio } from "@/shared/ui/radio";
import type { ViewMode } from "@/shared/types";

export const ChangeViewMode = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("normal");

  const handleChange = (value: ViewMode) => {
    workerApi.call("setViewMode", [value]);
    setViewMode(value);
  };

  return (
    <Radio
      value={viewMode}
      onChange={handleChange}
      options={[
        { text: "Клетки", value: "normal" },
        { text: "Органика", value: "organic" },
        { text: "Энергия", value: "energy" },
        { text: "Геном", value: "genome-hash" },
      ]}
    />
  );
};
