import { WORLD_HEIGHT, WORLD_WIDTH } from "@/shared/constants";
import { WorkerServer } from "@/shared/utils/worker-api";
import type { WorkerApi, WorkerApiEvents, WorkerApiResults } from "@/shared/worker-protocol";
import { RandomSampleTickStrategy } from "@/simulation/tick-strategy";
import { World } from "@/simulation/world";
import { FrameRenderer } from "./frame-renderer";
import { SelectionManager } from "./selection-manager";
import { Simulation } from "./simulation";
import { WorldDataPublisher } from "./world-data-publisher";

const world = new World(WORLD_WIDTH, WORLD_HEIGHT);
const renderer = new FrameRenderer(world);
const tickStrategy = new RandomSampleTickStrategy();
const selection = new SelectionManager();

const ctx = {
  server: null as unknown as WorkerServer<WorkerApi, WorkerApiResults, WorkerApiEvents>,
};

const publisher = new WorldDataPublisher((data) => ctx.server.emit("data", data));

const simulation = new Simulation(world, renderer, tickStrategy, selection, publisher, {
  onSelectedItemUpdate: (item) => ctx.server.emit("selectedItemUpdate", item),
  onSpeedChanged: (speed) => ctx.server.emit("speedChanged", speed),
});

ctx.server = new WorkerServer<WorkerApi, WorkerApiResults, WorkerApiEvents>(self, {
  selectItem: (...params) => simulation.selectItem(...params),
  setSpeed: (speed) => simulation.setSpeed(speed),
  getSpeed: () => simulation.getSpeed(),
  setViewMode: (mode) => simulation.setViewMode(mode),
  getLatestFrame: () => simulation.getLatestFrame(),
  getObjectAt: (position) => simulation.getObjectAt(position),
  ackData: () => simulation.ackData(),
});

simulation.init();
