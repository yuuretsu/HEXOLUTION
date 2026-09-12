import type { WorkerApi, WorkerApiEvents, WorkerApiResults } from "./worker-protocol";
import { WorkerClient } from "./worker-rpc";
import SimulationWorker from "@/app/worker/index.ts?worker";

export type { WorkerApiEvents, WorldData } from "./worker-protocol";

type AppWorkerClient = WorkerClient<WorkerApi, WorkerApiResults, WorkerApiEvents>;

let client: AppWorkerClient | null = null;

const getClient = (): AppWorkerClient => {
  if (!client) {
    throw new Error("Worker API is not started. Call startWorkerApi() from app bootstrap.");
  }
  return client;
};

/** Create the simulation worker and start listening. Call once from main bootstrap. */
export const startWorkerApi = (): AppWorkerClient => {
  if (client) return client;
  client = new WorkerClient<WorkerApi, WorkerApiResults, WorkerApiEvents>(
    new SimulationWorker(),
  );
  client.listen();
  return client;
};

/** Stable facade — safe to import anywhere; methods fail until startWorkerApi(). */
export const workerApi: Pick<AppWorkerClient, "call" | "on"> = {
  call: (method, params, transfer) => getClient().call(method, params, transfer),
  on: (name, handler) => getClient().on(name, handler),
};
