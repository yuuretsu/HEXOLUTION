import { useEffect, useState } from "react";
import { workerApi, type WorkerApiEvents } from "@/shared/api";

export const useWorkerEvent = <Name extends keyof WorkerApiEvents>(name: Name) => {
  const [data, setData] = useState<WorkerApiEvents[Name] | null>(null);

  useEffect(() => {
    const unsubscribe = workerApi.on(name, setData);

    return unsubscribe;
  }, [name]);

  return data;
};
