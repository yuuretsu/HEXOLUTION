import { WorkerServer } from "shared/utils/worker-api";
import type { WorkerApi, WorkerApiEvents, WorkerApiResults } from "shared/worker-protocol";
import { Simulation } from "./simulation";

const simulation = new Simulation({
  onData: (data) => server.emit("data", data),
  onSelectedItemUpdate: (item) => server.emit("selectedItemUpdate", item),
  onSpeedChanged: (speed) => server.emit("speedChanged", speed),
});

const server = new WorkerServer<WorkerApi, WorkerApiResults, WorkerApiEvents>(self, {
  selectItem: (...params) => simulation.selectItem(...params),
  setSpeed: (speed) => simulation.setSpeed(speed),
  getSpeed: () => simulation.getSpeed(),
  setViewMode: (mode) => simulation.setViewMode(mode),
  getLatestFrame: () => simulation.getLatestFrame(),
  getObjectAt: (position) => simulation.getObjectAt(position),
  ackData: () => simulation.ackData(),
});

simulation.init();
