import { type FC } from "react";
import { useSimulationSpeed } from "hooks/use-simulation-speed";
import { HiPlay, HiPause } from "react-icons/hi2";

export const PlayPause: React.FC = () => {
  const { isPlaying, togglePlayPause } = useSimulationSpeed();

  return (
    <button
      className="blur-bg"
      onClick={togglePlayPause}
      style={{
        width: 48,
        height: 48,
        backgroundColor: "transparent",
        borderRadius: 16,
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        cursor: "pointer"
      }}
    >
      {isPlaying ? (
        <HiPause size={"1.5rem"} />
      ) : (
        <HiPlay size={"1.5rem"} />
      )}
    </button>
  );
};
