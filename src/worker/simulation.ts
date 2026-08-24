import { WORLD_HEIGHT, WORLD_WIDTH } from "@/shared/constants";
import type { ViewMode } from "@/shared/types";
import type { ITickStrategy } from "@/simulation/tick-strategy";
import type { World } from "@/simulation/world";
import { FrameRenderer } from "./frame-renderer";
import { serializeSelectedItem } from "./selected-item";
import { SelectionManager } from "./selection-manager";
import { SimulationLoop } from "./simulation-loop";
import { WorldDataPublisher } from "./world-data-publisher";
import { populateWorld } from "./world-generator";

type SimulationEvents = {
  onSelectedItemUpdate: (item: ReturnType<typeof serializeSelectedItem>) => void;
  onSpeedChanged: (speed: number) => void;
};

export class Simulation {
  private readonly loop: SimulationLoop;
  private viewMode: ViewMode = "normal";
  private readonly world: World;
  private readonly renderer: FrameRenderer;
  private readonly selection: SelectionManager;
  private readonly publisher: WorldDataPublisher;
  private readonly events: SimulationEvents;

  constructor(
    world: World,
    renderer: FrameRenderer,
    tickStrategy: ITickStrategy,
    selection: SelectionManager,
    publisher: WorldDataPublisher,
    events: SimulationEvents,
  ) {
    this.world = world;
    this.renderer = renderer;
    this.selection = selection;
    this.publisher = publisher;
    this.events = events;
    this.loop = new SimulationLoop(world, tickStrategy, () => this.render());
  }

  async init() {
    await populateWorld(this.world, () => this.render());
    this.loop.start();
  }

  selectItem(...params: [number, number] | []) {
    this.selection.select(this.world.grid, ...params);
    this.events.onSelectedItemUpdate(serializeSelectedItem(this.selection.selectedItem));
  }

  setSpeed(speed: number) {
    this.loop.setSpeed(speed);
    this.events.onSpeedChanged(speed);
  }

  getSpeed() {
    return this.loop.getSpeed();
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    this.render();
  }

  getLatestFrame() {
    return this.renderer.getFrame();
  }

  ackData() {
    this.publisher.ack();
  }

  getObjectAt({ x, y }: { x: number; y: number }) {
    const item = this.world.grid.get(Math.floor(x), Math.floor(y));
    return item ? { type: item.kind, color: item.getColor() } : null;
  }

  private render() {
    const { entries, creaturesEnergy, foodEnergy, selectedItem } =
      this.renderer.render(this.viewMode, this.selection.selectedId);

    this.selection.syncFromRender(selectedItem);

    this.publisher.publish(
      {
        worldEnergy: this.world.energy,
        creaturesEnergy,
        foodEnergy,
        worldAge: this.loop.getAge(),
        worldSize: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
        worldEntries: entries.getMostCommon(5),
      },
      () => this.events.onSelectedItemUpdate(serializeSelectedItem(this.selection.selectedItem)),
    );
  }
}
