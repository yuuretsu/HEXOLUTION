import { useState } from "react";
import { workerApi } from "simulation-worker-api";
import { Radio } from "ui/radio";

export const ChangeViewMode = () => {
  const [viewMode, setViewMode] = useState<string>("normal");

  const handleChange = (value: string) => {
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
      ]}
    />
  )
};
