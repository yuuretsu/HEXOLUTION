import { type FC } from "react";
import { useSimulationSpeed } from "@/shared/hooks/use-simulation-speed";
import { Radio } from "@/shared/ui/radio";
export { TogglePlayPause } from "./toggle-play-pause";

export const ChangeSimulationSpeed: FC = () => {
  const { speed, setSpeed } = useSimulationSpeed();

  return (
    <Radio<number>
      value={speed}
      onChange={setSpeed}
      options={[
        { text: "пауза", value: 0 },
        { text: "1", value: 1 },
        { text: "2", value: 2 },
        { text: "5", value: 5 },
        { text: "10", value: 10 },
        { text: "25", value: 25 },
      ]}
    />
  );
};
