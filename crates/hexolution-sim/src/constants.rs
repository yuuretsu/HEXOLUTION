//! CLANS3 simulation constants (1:1 port of `simulation/clans/constants.ts`).

/// Max living cells (souls pool).
pub const TOTAL_CELL_COUNT: usize = 400_000;

/// Max genomes in the gene pool.
pub const TOTAL_GENOME_COUNT: usize = 8_000;

/// Bytes per genome: 32 genes × 21 + usage flag.
pub const GENOME_BYTES: usize = 674;
pub const GENES_PER_GENOME: usize = 32;
pub const BYTES_PER_GENE: usize = 21;
pub const GENOME_FLAG_INDEX: usize = 673;

pub const ROOT_DRAIN: i32 = 1;
pub const ANTENNA_DRAIN: f64 = 1.0;
pub const ALONE_ENERGY_DRAIN: f64 = 6.0;

pub const ORGANIC_EXCESS: i32 = 512;
pub const ENERGY_EXCESS: f64 = 512.0;

pub const MAX_AGE: i32 = 3;
pub const TISSUE_ENERGY_PER_STEP: f64 = 0.04;
pub const SEED_ENERGY_PER_STEP: f64 = 0.5;
pub const APEX_ENERGY_PER_STEP: f64 = 1.0;
pub const MOVE_APEX_COST: f64 = 1.0;

pub const SUN_BASE: i32 = 10;
pub const SUN_COEFFICIENT: f64 = 0.0008;

pub const CELL_ORGANIC_COST: i32 = 15;
pub const GROWTH_WORK_COST: i32 = 5;

pub const MAX_APEX_ENERGY: f64 = 1024.0;
pub const MAX_SEED_ENERGY: f64 = 512.0;

/// Gene value ≤ this is a condition (else ignored).
pub const MAX_CONDITION_CODE: u8 = 67;
/// Gene value ≤ this is a command (attached cell).
pub const MAX_ATTACHED_COMMAND: u8 = 14;
/// Gene value ≤ this is a command (alone cell).
pub const MAX_ALONE_COMMAND: u8 = 17;

/// Initial soil organic / charge per cell.
pub const INITIAL_ORGANIC: i32 = 200;
pub const INITIAL_SOIL_ENERGY: f32 = 200.0;

/// Spawn spacing for initial apex seeds.
pub const SPAWN_STEP: i32 = 12;

/// Energy given to a newly spawned apex.
pub const INITIAL_APEX_ENERGY: f64 = 500.0;

/// Mutation chance percent when spawning a new apex (0–100).
pub const MUTATION_CHANCE_PERCENT: f64 = 1.0;

/// Cost of one new segment (organic + growth work).
pub const SEGMENT_COST: i32 = GROWTH_WORK_COST + CELL_ORGANIC_COST;
