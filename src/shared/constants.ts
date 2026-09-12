import { HEX_ASPECT } from "@/shared/hex-math";

export { HEX_ASPECT, SQRT3 } from "@/shared/hex-math";

/** Starting simulation speed. Paused in dev so the world can be inspected before ticks. */
export const INITIAL_SIMULATION_SPEED = import.meta.env.DEV ? 0 : 1;

/** World width in cells. */
export const WORLD_WIDTH = 128;

/** World height in cells (even, derived from HEX_ASPECT). */
export const WORLD_HEIGHT = Math.round(WORLD_WIDTH / HEX_ASPECT / 2) * 2;

/** Energy transferred from the world to a creature on spawn. */
export const INITIAL_CREATURE_ENERGY = 100;

/** Number of stone blobs placed during world generation. */
export const STONE_BLOB_COUNT = 25;

/** Number of creature placement attempts during world population. */
export const CREATURE_SPAWN_ATTEMPTS = 50_000;

/** How often to refresh render progress while spawning creatures. */
export const CREATURE_SPAWN_PROGRESS_EVERY = 10_000;

export {
  MAX_CELL_ENERGY,
  ENERGY_PER_CELL,
  GENOME_LENGTH,
  GENES_PER_TICK,
  GENOME_MUTATION_RATE,
  COLORATION_MUTATION_RATE,
  AGE_ENERGY_COST_FACTOR,
} from "@hexolution/simulation";
