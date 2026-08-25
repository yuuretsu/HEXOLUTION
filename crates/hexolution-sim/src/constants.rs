pub const GENOME_LENGTH: usize = 32 * 3;
pub const HEX_ASPECT: f64 = 0.866;
pub const WORLD_WIDTH: i32 = 128;
pub const WORLD_HEIGHT: i32 = ((WORLD_WIDTH as f64 / HEX_ASPECT / 2.0).round() as i32) * 2;
pub const MAX_CELL_ENERGY: i32 = 1000;
pub const ENERGY_PER_CELL: i32 = 100;
pub const INITIAL_CREATURE_ENERGY: i32 = 100;
pub const STONE_BLOB_COUNT: u32 = 25;
pub const CREATURE_SPAWN_ATTEMPTS: u32 = 50_000;
pub const GENES_PER_TICK: u32 = 16;
pub const GENOME_MUTATION_RATE: f64 = 0.001;
pub const COLORATION_MUTATION_RATE: f64 = 10.0;
pub const AGE_ENERGY_COST_FACTOR: f64 = 0.0005;

pub const COLOR_MOVE_FORWARD: [f32; 4] = [0.0, 150.0, 255.0, 255.0];
pub const COLOR_PHOTOSYNTHESIS: [f32; 4] = [0.0, 200.0, 0.0, 255.0];
pub const COLOR_ATTACK: [f32; 4] = [255.0, 0.0, 0.0, 255.0];
pub const COLOR_PUSH: [f32; 4] = [0.0, 0.0, 255.0, 255.0];
pub const GRAY: [f32; 4] = [100.0, 100.0, 100.0, 255.0];
pub const ENERGY_COLOR_HOT: [f32; 4] = [255.0, 255.0, 0.0, 255.0];
pub const FOOD_COLOR_FULL: [f32; 4] = [75.0, 75.0, 50.0, 255.0];

pub const PHOTOSYNTHESIS_ABUNDANCE_RATIO: f64 = 0.3;
pub const PHOTOSYNTHESIS_MAX_YIELD: f64 = 50.0;
pub const MOVE_ENERGY_COST: i32 = 2;
pub const PHOTOSYNTHESIS_ENERGY_COST: i32 = 2;
pub const REPRODUCE_ENERGY_COST: i32 = 10;
pub const REPRODUCE_MIN_ENERGY: i32 = 100;
pub const ATTACK_ENERGY_COST: i32 = 10;
pub const ATTACK_MAX_STRENGTH: f64 = 200.0;
pub const PUSH_ENERGY_COST: i32 = 10;
pub const SPECIALIZATION_LEARN_RATE: f64 = 0.002;
pub const FRIEND_COLORATION_THRESHOLD: f64 = 0.1;

pub const GENE_COUNT: usize = 10;
