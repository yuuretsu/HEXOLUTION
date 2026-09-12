import { Radio } from "@/shared/ui/radio";
import type { ViewMode } from "@/shared/types";
import { useViewMode } from "./use-view-mode";

export const ChangeViewMode = () => {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <Radio
      value={viewMode}
      onChange={(value: ViewMode) => setViewMode(value)}
      options={[
        { text: "Normal", value: "normal" },
        { text: "Energy", value: "energy" },
        { text: "Genome Hash", value: "genome-hash" },
        { text: "Coloration", value: "coloration" },
        { text: "Last Action", value: "last-action" },
      ]}
    />
  );
};
