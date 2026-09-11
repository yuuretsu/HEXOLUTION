import { useState, useEffect, useCallback } from "react";
import { INITIAL_SIMULATION_SPEED } from "@/shared/constants";
import { workerApi } from "@/shared/worker-client";

export const useSimulationSpeed = () => {
  const [speed, setSpeed] = useState(INITIAL_SIMULATION_SPEED);
  const [lastActiveSpeed, setLastActiveSpeed] = useState(1);
  const isPlaying = speed > 0;

  useEffect(() => {
    workerApi.call("getSpeed", []).then(currentSpeed => {
      setSpeed(currentSpeed);
      if (currentSpeed > 0) {
        setLastActiveSpeed(currentSpeed);
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = workerApi.on("speedChanged", (newSpeed) => {
      setSpeed(newSpeed);
      if (newSpeed > 0) {
        setLastActiveSpeed(newSpeed);
      }
    });
    return unsubscribe;
  }, []);

  const setSpeedAndNotify = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    if (newSpeed > 0) {
      setLastActiveSpeed(newSpeed);
    }
    workerApi.call("setSpeed", [newSpeed]);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (speed > 0) {
      workerApi.call("setSpeed", [0]);
      setSpeed(0);
    } else {
      const speedToRestore = lastActiveSpeed > 0 ? lastActiveSpeed : 1;
      workerApi.call("setSpeed", [speedToRestore]);
      setSpeed(speedToRestore);
    }
  }, [speed, lastActiveSpeed]);

  return {
    speed,
    isPlaying,
    setSpeed: setSpeedAndNotify,
    togglePlayPause
  };
};
