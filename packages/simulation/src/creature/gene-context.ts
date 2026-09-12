import { sendEnergy, type World } from "../world";
import type { WorldItem } from "../world";
import type { Creature } from "./creature";

const scratch: [number, number] = [0, 0];

/**
 * Reusable creature↔world API for gene handlers (no behavior policy).
 * Call `bind` once per process tick; `swapHere` keeps `x/y` in sync after moves.
 */
export class GeneContext {
  creature!: Creature;
  x = 0;
  y = 0;
  private world!: World;

  bind(creature: Creature, world: World, x: number, y: number): this {
    this.creature = creature;
    this.world = world;
    this.x = x;
    this.y = y;
    return this;
  }

  /** Pay energy from creature into the ambient pool. */
  pay(cost: number): void {
    sendEnergy(this.creature, this.world, cost);
  }

  /** Take energy from the ambient pool into the creature. */
  absorb(amount: number): void {
    sendEnergy(this.world, this.creature, amount);
  }

  /** Transfer energy from the acting creature to another entity. */
  give(to: { energy: number }, amount: number): void {
    sendEnergy(this.creature, to, amount);
  }

  /** Transfer energy from an entity into the acting creature. */
  take(from: { energy: number }, amount: number): void {
    sendEnergy(from, this.creature, amount);
  }

  /** Ambient energy as a 0..1 abundance factor (squared). */
  ambientAbundance(shareOfTotal: number): number {
    return Math.min(1, this.world.energy / (this.world.totalEnergy * shareOfTotal)) ** 2;
  }

  /**
   * Hex coords from current cell along an absolute facing `direction`.
   * Writes into `out` (or a shared scratch) and returns it.
   */
  cellCoords(
    direction: number,
    distance = 1,
    out: [number, number] = scratch,
  ): [number, number] {
    this.world.grid.getCoordsByNarrow(this.x, this.y, direction, distance, out);
    return out;
  }

  getAt(x: number, y: number): WorldItem | undefined {
    return this.world.grid.get(x, y);
  }

  setAt(x: number, y: number, item: WorldItem | undefined): void {
    this.world.grid.set(x, y, item);
  }

  swapCells(ax: number, ay: number, bx: number, by: number): void {
    this.world.grid.swap(ax, ay, bx, by);
  }

  /** Swap current cell with `(nx, ny)` and update tracked position. */
  swapHere(nx: number, ny: number): void {
    this.world.grid.swap(this.x, this.y, nx, ny);
    this.x = nx;
    this.y = ny;
  }

  /** Ambient energy pool (for `handleAttack` and similar). */
  get energyPool(): { energy: number } {
    return this.world;
  }
}

/** Shared instance — bind per tick to avoid allocations. */
export const geneContext = new GeneContext();
