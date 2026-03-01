import { useEffect, useState } from "react";
import { workerApi, type ApiEvents } from "simulation-worker-api";

export const useWorkerEvent = <Name extends keyof ApiEvents>(name: Name) => {
  const [data, setData] = useState<ApiEvents[Name] | null>(null);

  useEffect(() => {
    const unsubscribe = workerApi.on(name, setData);

    return unsubscribe;
  }, [name]);

  return data;
};