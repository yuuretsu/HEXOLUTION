import { WorkerServer, withTransfer } from "@/shared/api";
import type { WorkerApi, WorkerApiEvents, WorkerApiResults } from "@/shared/api";
import { getGeneMeta } from "@hexolution/simulation";
import { Simulation } from "./simulation";

const bootstrap = () => {
  type Server = WorkerServer<WorkerApi, WorkerApiResults, WorkerApiEvents>;
  const runtime: { server?: Server } = {};

  const simulation = new Simulation({
    onStats: (data) => runtime.server?.emit("stats", data),
    onSelection: (item) => runtime.server?.emit("selection", item),
    onSpeedChanged: (speed) => runtime.server?.emit("speedChanged", speed),
  });

  runtime.server = new WorkerServer<WorkerApi, WorkerApiResults, WorkerApiEvents>(self, {
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

  runtime.server.listen();
  void simulation.init();
};

bootstrap();
