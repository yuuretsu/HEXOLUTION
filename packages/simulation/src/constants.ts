/** Max cell energy; the creature dies if this is exceeded. */
export const MAX_CELL_ENERGY = 1000;

/** Per-cell contribution to the world's total energy budget. */
export const ENERGY_PER_CELL = 100;

/** Creature genome length in base units. */
export const GENOME_LENGTH = 32 * 3;

/** Number of genes a creature executes per tick. */
export const GENES_PER_TICK = 16;

/** Per-base mutation probability when reproducing. */
export const GENOME_MUTATION_RATE = 0.001;

/** Random coloration shift strength on reproduction. */
export const COLORATION_MUTATION_RATE = 10;

/** Age-based energy drain multiplier: age × factor per tick. */
export const AGE_ENERGY_COST_FACTOR = 0.0005;
