import type { ITickStrategy } from "@/simulation/tick-strategy";
import type { World } from "@/simulation/world";

export class SimulationLoop {
  private speedMultiplier = 1;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private age = 0;
  private readonly world: World;
  private readonly tickStrategy: ITickStrategy;
  private readonly onTickComplete: (age: number) => void;

  constructor(world: World, tickStrategy: ITickStrategy, onTickComplete: (age: number) => void) {
    this.world = world;
    this.tickStrategy = tickStrategy;
    this.onTickComplete = onTickComplete;
  }

  getAge() {
    return this.age;
  }

  getSpeed() {
    return this.speedMultiplier;
  }

  setSpeed(speed: number) {
    this.speedMultiplier = speed;
    if (speed > 0) this.schedule();
  }

  start() {
    this.schedule();
  }

  private tick = () => {
    if (this.speedMultiplier <= 0) return;

    const { width, height } = this.world.grid;
    for (let i = 0; i < width * height * this.speedMultiplier; i++) {
      this.age++;
      this.tickStrategy.tickOnce(this.world);
    }

    this.onTickComplete(this.age);
    this.schedule();
  };

  private schedule() {
    if (this.loopTimer !== null) return;
    this.loopTimer = setTimeout(() => {
      this.loopTimer = null;
      this.tick();
    }, 0);
  }
}
