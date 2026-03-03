import { useState, useEffect, useCallback } from "react";
import { workerApi } from "simulation-worker-api";

export const useSimulationSpeed = () => {
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lastActiveSpeed, setLastActiveSpeed] = useState(1);

  useEffect(() => {
    workerApi.call("getSpeed", []).then(currentSpeed => {
      setSpeed(currentSpeed);
      setIsPlaying(currentSpeed > 0);
      if (currentSpeed > 0) {
        setLastActiveSpeed(currentSpeed);
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = workerApi.on("speedChanged", (newSpeed) => {
      setSpeed(newSpeed);
      setIsPlaying(newSpeed > 0);
      if (newSpeed > 0) {
        setLastActiveSpeed(newSpeed);
      }
    });
    return unsubscribe;
  }, []);

  const setSpeedAndNotify = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    setIsPlaying(newSpeed > 0);
    if (newSpeed > 0) {
      setLastActiveSpeed(newSpeed);
    }
    workerApi.call("setSpeed", [newSpeed]);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      workerApi.call("setSpeed", [0]);
      setSpeed(0);
      setIsPlaying(false);
    } else {
      const speedToRestore = lastActiveSpeed > 0 ? lastActiveSpeed : 1;
      workerApi.call("setSpeed", [speedToRestore]);
      setSpeed(speedToRestore);
      setIsPlaying(true);
    }
  }, [isPlaying, lastActiveSpeed]);

  return {
    speed,
    isPlaying,
    setSpeed: setSpeedAndNotify,
    togglePlayPause
  };
};
