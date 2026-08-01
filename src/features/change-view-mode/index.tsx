import { useState } from "react";
import { workerApi } from "shared/worker-client";
import { Radio } from "shared/ui/radio";
import type { ViewMode } from "shared/types";

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
        { text: "Normal", value: "normal" },
        { text: "Energy", value: "energy" },
        { text: "Genome Hash", value: "genome-hash" },
        { text: "Coloration", value: "coloration" },
      ]}
    />
  )
};
