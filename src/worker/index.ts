import { WorkerServer, withTransfer } from "@/shared/utils/worker-api";
import type { WorkerApi, WorkerApiEvents, WorkerApiResults } from "@/shared/worker-protocol";
import { getGeneMeta } from "@hexolution/simulation";
import { Simulation } from "./simulation";

const simulation = new Simulation({
  onStats: (data) => server.emit("stats", data),
  onSelection: (item) => server.emit("selection", item),
  onSpeedChanged: (speed) => server.emit("speedChanged", speed),
});

const server = new WorkerServer<WorkerApi, WorkerApiResults, WorkerApiEvents>(self, {
  selectItem: (...params) => simulation.selectItem(...params),
  setSpeed: (speed) => simulation.setSpeed(speed),
  getSpeed: () => simulation.getSpeed(),
  getLatestGrid: () => {
    const grid = simulation.getLatestGrid();
    if (!grid) return null;
    return withTransfer(grid, [grid.buffer]);
  },
  returnGrid: (buffer) => simulation.returnGrid(buffer),
  getObjectAt: (position) => simulation.getObjectAt(position),
  ackStats: () => simulation.ackStats(),
  getGeneMeta: () => getGeneMeta(),
});

simulation.init();
