import type { Rgba } from "@/shared/types";

/** Hex cell height-to-width aspect ratio (rendering + world gen). */
export const HEX_ASPECT = 0.866;

/** World width in cells. */
export const WORLD_WIDTH = 128;

/** World height in cells (even, derived from HEX_ASPECT). */
export const WORLD_HEIGHT = Math.round(WORLD_WIDTH / HEX_ASPECT / 2) * 2;

/** Creature genome length in base units. */
export const GENOME_LENGTH = 32 * 3;

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

/** Number of genes a creature executes per tick. */
export const GENES_PER_TICK = 16;

/** Per-base mutation probability when reproducing. */
export const GENOME_MUTATION_RATE = 0.001;

/** Random coloration shift strength on reproduction. */
export const COLORATION_MUTATION_RATE = 10;

/** Age-based energy drain multiplier: age × factor per tick. */
export const AGE_ENERGY_COST_FACTOR = 0.0005;

export const COLOR_MOVE_FORWARD: Rgba = [0, 150, 255, 255];
export const COLOR_PHOTOSYNTHESIS: Rgba = [0, 200, 0, 255];
export const COLOR_ATTACK: Rgba = [255, 0, 0, 255];
export const COLOR_PUSH: Rgba = [0, 0, 255, 255];
export const COLOR_GRAY: Rgba = [100, 100, 100, 255];
export const COLOR_ENERGY_HOT: Rgba = [255, 255, 0, 255];
export const COLOR_FOOD_FULL: Rgba = [75, 75, 50, 255];

export const PHOTOSYNTHESIS_ABUNDANCE_RATIO = 0.3;
export const PHOTOSYNTHESIS_MAX_YIELD = 50;
export const MOVE_ENERGY_COST = 2;
export const PHOTOSYNTHESIS_ENERGY_COST = 2;
export const REPRODUCE_ENERGY_COST = 10;
export const REPRODUCE_MIN_ENERGY = 100;
export const ATTACK_ENERGY_COST = 10;
export const ATTACK_MAX_STRENGTH = 200;
export const PUSH_ENERGY_COST = 10;
export const SPECIALIZATION_LEARN_RATE = 0.002;
export const FRIEND_COLORATION_THRESHOLD = 0.1;

/** Payload passed once into WASM at startup (hot path reads a Rust copy). */
export const SIM_CONFIG = {
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  hexAspect: HEX_ASPECT,
  genomeLength: GENOME_LENGTH,
  maxCellEnergy: MAX_CELL_ENERGY,
  energyPerCell: ENERGY_PER_CELL,
  initialCreatureEnergy: INITIAL_CREATURE_ENERGY,
  stoneBlobCount: STONE_BLOB_COUNT,
  creatureSpawnAttempts: CREATURE_SPAWN_ATTEMPTS,
  genesPerTick: GENES_PER_TICK,
  genomeMutationRate: GENOME_MUTATION_RATE,
  colorationMutationRate: COLORATION_MUTATION_RATE,
  ageEnergyCostFactor: AGE_ENERGY_COST_FACTOR,
  photosynthesisAbundanceRatio: PHOTOSYNTHESIS_ABUNDANCE_RATIO,
  photosynthesisMaxYield: PHOTOSYNTHESIS_MAX_YIELD,
  moveEnergyCost: MOVE_ENERGY_COST,
  photosynthesisEnergyCost: PHOTOSYNTHESIS_ENERGY_COST,
  reproduceEnergyCost: REPRODUCE_ENERGY_COST,
  reproduceMinEnergy: REPRODUCE_MIN_ENERGY,
  attackEnergyCost: ATTACK_ENERGY_COST,
  attackMaxStrength: ATTACK_MAX_STRENGTH,
  pushEnergyCost: PUSH_ENERGY_COST,
  specializationLearnRate: SPECIALIZATION_LEARN_RATE,
  friendColorationThreshold: FRIEND_COLORATION_THRESHOLD,
  colorMoveForward: COLOR_MOVE_FORWARD,
  colorPhotosynthesis: COLOR_PHOTOSYNTHESIS,
  colorAttack: COLOR_ATTACK,
  colorPush: COLOR_PUSH,
  colorGray: COLOR_GRAY,
  colorEnergyHot: COLOR_ENERGY_HOT,
  colorFoodFull: COLOR_FOOD_FULL,
} as const;

export type SimConfig = {
  -readonly [K in keyof typeof SIM_CONFIG]: (typeof SIM_CONFIG)[K] extends Rgba
    ? Rgba
    : (typeof SIM_CONFIG)[K];
};
