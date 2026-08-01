import { useSimulationSpeed } from "app/hooks/use-simulation-speed";
import { HiPlay, HiPause } from "react-icons/hi2";
import { IconButton } from "shared/ui/icon-button";

export const PlayPause: React.FC = () => {
  const { isPlaying, togglePlayPause } = useSimulationSpeed();

  return <IconButton onClick={togglePlayPause} Icon={isPlaying ? HiPause : HiPlay} />
};
