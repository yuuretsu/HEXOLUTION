import { type FC } from "react";
import { useSimulationSpeed } from "hooks/use-simulation-speed";
import { Radio } from "ui/radio";

export const ChangeSimulationSpeed: FC = () => {
  const { speed, setSpeed } = useSimulationSpeed();

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
  };

  return (
    <Radio<number>
      value={speed}
      onChange={handleSpeedChange}
      options={[
        { text: "1/128", value: 1 / 128 },
        { text: "1/16", value: 1 / 16 },
        { text: "1", value: 1 },
        { text: "2", value: 2 },
        { text: "4", value: 4 },
        { text: "8", value: 8 },
        { text: "16", value: 16 },
      ]}
    />
  );
};
