import type { WorkerApi, WorkerApiEvents, WorkerApiResults } from "shared/worker-protocol";
import { WorkerClient } from "shared/utils/worker-api";

export type { WorkerApiEvents as ApiEvents, WorldData } from "shared/worker-protocol";

export const workerApi = new WorkerClient<WorkerApi, WorkerApiResults, WorkerApiEvents>(
  new Worker(new URL("../worker/index.ts", import.meta.url), { type: "module" })
);

workerApi.listen();
