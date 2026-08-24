/** Creature genome length in base units. */
export const GENOME_LENGTH = 32 * 3;

/** Hex cell height-to-width aspect ratio. */
export const HEX_ASPECT = 0.866;

/** World width in cells. */
export const WORLD_WIDTH = 128;

/** World height in cells (even, derived from HEX_ASPECT). */
export const WORLD_HEIGHT = Math.round(WORLD_WIDTH / HEX_ASPECT / 2) * 2;

/** Max cell energy; the creature dies if this is exceeded. */
export const MAX_CELL_ENERGY = 1000;

/** Per-cell contribution to the world's total energy budget. */
export const ENERGY_PER_CELL = 100;

/** Energy transferred from the world to a creature on spawn. */
export const INITIAL_CREATURE_ENERGY = 100;

/** Number of stone blobs placed during world generation. */
export const STONE_BLOB_COUNT = 25;

/** Number of creature placement attempts during world population. */
export const CREATURE_SPAWN_ATTEMPTS = 50_000;

/** How often to refresh render progress while spawning creatures. */
export const CREATURE_SPAWN_PROGRESS_EVERY = 10_000;

/** Number of genes a creature executes per tick. */
export const GENES_PER_TICK = 16;

/** Per-base mutation probability when reproducing. */
export const GENOME_MUTATION_RATE = 0.001;

/** Random coloration shift strength on reproduction. */
export const COLORATION_MUTATION_RATE = 10;

/** Age-based energy drain multiplier: age × factor per tick. */
export const AGE_ENERGY_COST_FACTOR = 0.0005;
