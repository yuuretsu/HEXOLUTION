import { type FC } from "react";
import { useSimulationSpeed } from "hooks/use-simulation-speed";
import { Range } from "ui/range";

export const ChangeSimulationSpeed: FC = () => {
  const { speed, setSpeed } = useSimulationSpeed();

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
  };

  return (
    <Range
      caption={"Simulation speed".toUpperCase()}
      min={0}
      max={10}
      step={1}
      value={speed}
      onChange={handleSpeedChange}
    />
  );
};
