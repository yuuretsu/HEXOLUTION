/**
 * Vite `*?worker` modules expose a Worker constructor as default, but
 * eslint-plugin-import-x cannot see that export.
 */
// eslint-disable-next-line import-x/default -- Vite worker entry has no analyzable default export
import SimulationWorkerCtor from "@/app/worker/index.ts?worker";

/** Simulation web worker (app → worker boundary). */
export class SimulationWorker extends SimulationWorkerCtor {}
