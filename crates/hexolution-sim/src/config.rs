use serde::Deserialize;

fn default_hex_aspect() -> f64 {
    0.866
}

/// Simulation settings — filled once from TypeScript, then used on the hot path
/// with no further JS calls. Unknown fields are ignored.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub world_width: i32,
    pub world_height: i32,
    #[serde(default = "default_hex_aspect")]
    pub hex_aspect: f64,
    #[serde(default)]
    pub stone_blob_count: u32,
}
