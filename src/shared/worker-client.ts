import type { WorkerApi, WorkerApiEvents, WorkerApiResults } from "@/shared/worker-protocol";
import { WorkerClient } from "@/shared/utils/worker-api";
import SimulationWorker from "@/worker/index.ts?worker";

export type { WorkerApiEvents, WorldData } from "@/shared/worker-protocol";

export const workerApi = new WorkerClient<
  WorkerApi,
  WorkerApiResults,
  WorkerApiEvents
>(
  new SimulationWorker()
);

workerApi.listen();
