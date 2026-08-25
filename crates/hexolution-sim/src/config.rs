use serde::Deserialize;

fn rgba_from_slice(v: &[f32]) -> [f32; 4] {
    [v[0], v[1], v[2], v.get(3).copied().unwrap_or(255.0)]
}

/// Simulation settings — filled once from TypeScript, then used on the hot path
/// with no further JS calls.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub world_width: i32,
    pub world_height: i32,
    pub hex_aspect: f64,
    pub genome_length: usize,
    pub max_cell_energy: i32,
    pub energy_per_cell: i32,
    pub initial_creature_energy: i32,
    pub stone_blob_count: u32,
    pub creature_spawn_attempts: u32,
    pub genes_per_tick: u32,
    pub genome_mutation_rate: f64,
    pub coloration_mutation_rate: f64,
    pub age_energy_cost_factor: f64,
    pub photosynthesis_abundance_ratio: f64,
    pub photosynthesis_max_yield: f64,
    pub move_energy_cost: i32,
    pub photosynthesis_energy_cost: i32,
    pub reproduce_energy_cost: i32,
    pub reproduce_min_energy: i32,
    pub attack_energy_cost: i32,
    pub attack_max_strength: f64,
    pub push_energy_cost: i32,
    pub specialization_learn_rate: f64,
    pub friend_coloration_threshold: f64,
    #[serde(deserialize_with = "deserialize_rgba")]
    pub color_move_forward: [f32; 4],
    #[serde(deserialize_with = "deserialize_rgba")]
    pub color_photosynthesis: [f32; 4],
    #[serde(deserialize_with = "deserialize_rgba")]
    pub color_attack: [f32; 4],
    #[serde(deserialize_with = "deserialize_rgba")]
    pub color_push: [f32; 4],
    #[serde(deserialize_with = "deserialize_rgba")]
    pub color_gray: [f32; 4],
    #[serde(deserialize_with = "deserialize_rgba")]
    pub color_energy_hot: [f32; 4],
    #[serde(deserialize_with = "deserialize_rgba")]
    pub color_food_full: [f32; 4],
}

fn deserialize_rgba<'de, D>(deserializer: D) -> Result<[f32; 4], D::Error>
where
    D: serde::Deserializer<'de>,
{
    let v = Vec::<f32>::deserialize(deserializer)?;
    if v.len() < 3 {
        return Err(serde::de::Error::custom("rgba needs at least 3 channels"));
    }
    Ok(rgba_from_slice(&v))
}
