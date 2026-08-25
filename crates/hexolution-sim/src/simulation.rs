//! `wasm_bindgen` facade: tick loop, frame renderer and world/selection DTOs.
//! Rendering mirrors `worker/frame-renderer.ts` and `worker/selected-item.ts`.

use crate::cell_types::{
    CellType, Rgba, POISON_ENERGY_COLOR, POISON_ORGANIC_COLOR, CELL_TYPE_COUNT,
};
use crate::color::{lerp_rgba, pack_rgba_u32, pack_rgba_u8};
use crate::config::Config;
use crate::constants::{BYTES_PER_GENE, ENERGY_EXCESS, ORGANIC_EXCESS};
use crate::world::{Occupant, World};
use js_sys::{Object, Reflect, Uint8Array};
use serde::Serialize;
use wasm_bindgen::prelude::*;

const ORGANIC_FULL: Rgba = [180.0, 120.0, 40.0, 255.0];
const ENERGY_FULL: Rgba = [80.0, 80.0, 220.0, 255.0];
const EMPTY: Rgba = [20.0, 20.0, 30.0, 255.0];
const NEUTRAL: Rgba = [100.0, 100.0, 100.0, 255.0];

#[derive(Clone, Copy, PartialEq, Eq)]
enum ViewMode {
    Normal,
    Energy,
    Organic,
    GenomeHash,
    Coloration,
}

impl ViewMode {
    fn parse(s: &str) -> Self {
        match s {
            "energy" => Self::Energy,
            "organic" => Self::Organic,
            "genome-hash" => Self::GenomeHash,
            "coloration" => Self::Coloration,
            _ => Self::Normal,
        }
    }
}

#[derive(Serialize)]
struct WorldSizeDto {
    width: i32,
    height: i32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WorldDataDto {
    organic_soil: f64,
    energy_soil: f64,
    organic_poison: u32,
    energy_poison: u32,
    mutations: u32,
    living_cells: u32,
    world_age: u64,
    world_size: WorldSizeDto,
    type_counts: [u32; CELL_TYPE_COUNT],
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SelectedItemDto {
    #[serde(rename = "type")]
    item_type: String,
    color: Rgba,
    #[serde(skip_serializing_if = "Option::is_none")]
    cell_type: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    energy: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    age: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    level: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    active_gene: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    clan_id: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    direction: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    parent: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    genome_index: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    gene_bytes: Option<Vec<u8>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    organic_here: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    energy_here: Option<f64>,
}

#[derive(Serialize)]
struct ObjectAtDto {
    #[serde(rename = "type")]
    item_type: String,
    color: Rgba,
}

#[wasm_bindgen]
pub struct Simulation {
    world: World,
    pixel_buffer: Vec<u8>,
    speed_multiplier: f64,
    view_mode: ViewMode,
    selected_id: u32,
    age: u64,
    latest_world_data: JsValue,
    latest_selected: JsValue,
}

#[wasm_bindgen]
impl Simulation {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<Simulation, JsValue> {
        let config: Config = serde_wasm_bindgen::from_value(config)
            .map_err(|e| JsValue::from_str(&format!("invalid sim config: {e}")))?;
        if config.world_width <= 0 || config.world_height <= 0 {
            return Err(JsValue::from_str("worldWidth/worldHeight must be positive"));
        }
        if config.hex_aspect <= 0.0 {
            return Err(JsValue::from_str("hexAspect must be positive"));
        }

        let width = config.world_width;
        let height = config.world_height;
        // Single JS clock read; the simulation RNG is pure Rust from here on.
        let seed = js_sys::Date::now() as u64;
        let mut world = World::new(config, seed);
        world.populate();

        let pixel_len = (width as usize) * (height as usize) * 4;
        let mut sim = Simulation {
            world,
            pixel_buffer: vec![0; pixel_len],
            speed_multiplier: 1.0,
            view_mode: ViewMode::Normal,
            selected_id: 0,
            age: 0,
            latest_world_data: JsValue::NULL,
            latest_selected: JsValue::NULL,
        };
        sim.render_internal();
        Ok(sim)
    }

    #[wasm_bindgen(js_name = selectItem)]
    pub fn select_item(&mut self, x: Option<f64>, y: Option<f64>) {
        match (x, y) {
            (Some(x), Some(y)) => {
                let occupant = *self.world.grid.get(x.floor() as i32, y.floor() as i32);
                self.selected_id = self.world.occupant_id(&occupant);
            }
            _ => self.selected_id = 0,
        }
        self.latest_selected = match (x, y) {
            (Some(x), Some(y)) if self.selected_id != 0 => {
                let (gx, gy) = (x.floor() as i32, y.floor() as i32);
                let occupant = *self.world.grid.get(gx, gy);
                match self.serialize_selected(&occupant, gx, gy) {
                    Some(dto) => serde_wasm_bindgen::to_value(&dto).unwrap_or(JsValue::NULL),
                    None => JsValue::NULL,
                }
            }
            _ => JsValue::NULL,
        };
    }

    #[wasm_bindgen(js_name = setSpeed)]
    pub fn set_speed(&mut self, speed: f64) {
        self.speed_multiplier = speed;
    }

    #[wasm_bindgen(js_name = getSpeed)]
    pub fn get_speed(&self) -> f64 {
        self.speed_multiplier
    }

    #[wasm_bindgen(js_name = setViewMode)]
    pub fn set_view_mode(&mut self, mode: &str) {
        self.view_mode = ViewMode::parse(mode);
        self.render_internal();
    }

    /// One unit of speed = one full CLANS3 simulation step over all living cells.
    pub fn tick(&mut self) {
        if self.speed_multiplier <= 0.0 {
            return;
        }
        let steps = self.speed_multiplier.floor().max(1.0) as u32;
        for _ in 0..steps {
            self.world.simulation_step();
            self.age += 1;
        }
    }

    #[wasm_bindgen(js_name = getLatestFrame)]
    pub fn get_latest_frame(&mut self) -> JsValue {
        self.render_internal();
        let buffer = Uint8Array::new_with_length(self.pixel_buffer.len() as u32);
        buffer.copy_from(&self.pixel_buffer);
        let obj = Object::new();
        Reflect::set(&obj, &"buffer".into(), &buffer.buffer()).ok();
        Reflect::set(&obj, &"width".into(), &JsValue::from(self.world.grid.width)).ok();
        Reflect::set(&obj, &"height".into(), &JsValue::from(self.world.grid.height)).ok();
        obj.into()
    }

    #[wasm_bindgen(js_name = getWorldData)]
    pub fn get_world_data(&self) -> JsValue {
        self.latest_world_data.clone()
    }

    #[wasm_bindgen(js_name = getSelectedItem)]
    pub fn get_selected_item(&self) -> JsValue {
        self.latest_selected.clone()
    }

    #[wasm_bindgen(js_name = getObjectAt)]
    pub fn get_object_at(&self, x: f64, y: f64) -> JsValue {
        let occupant = *self.world.grid.get(x.floor() as i32, y.floor() as i32);
        if matches!(occupant, Occupant::Empty) {
            return JsValue::NULL;
        }
        serde_wasm_bindgen::to_value(&ObjectAtDto {
            item_type: occupant.kind().to_string(),
            color: self.world.occupant_color(&occupant),
        })
        .unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen(js_name = worldWidth)]
    pub fn world_width(&self) -> i32 {
        self.world.grid.width
    }

    #[wasm_bindgen(js_name = worldHeight)]
    pub fn world_height(&self) -> i32 {
        self.world.grid.height
    }
}

impl Simulation {
    fn render_internal(&mut self) {
        let width = self.world.grid.width as usize;
        let height = self.world.grid.height as usize;
        let view_mode = self.view_mode;
        let selected_id = self.selected_id;
        let mut type_counts = [0u32; CELL_TYPE_COUNT];
        let mut selected: Option<SelectedItemDto> = None;

        for y in 0..height {
            for x in 0..width {
                let occupant = *self.world.grid.get(x as i32, y as i32);
                let index = y * width + x;
                let offset = index * 4;

                if matches!(occupant, Occupant::Empty) {
                    match view_mode {
                        ViewMode::Organic => {
                            let color = paint_soil_organic(&self.world, x as i32, y as i32);
                            write_pixel(&mut self.pixel_buffer, offset, pack_rgba_u32(&color));
                        }
                        ViewMode::Energy => {
                            let color = paint_soil_energy(&self.world, x as i32, y as i32);
                            write_pixel(&mut self.pixel_buffer, offset, pack_rgba_u32(&color));
                        }
                        _ => self.pixel_buffer[offset..offset + 4].fill(0),
                    }
                    continue;
                }

                if selected_id != 0 && self.world.occupant_id(&occupant) == selected_id {
                    selected = self.serialize_selected(&occupant, x as i32, y as i32);
                }
                if let Occupant::Cell(ci) = occupant {
                    type_counts[self.world.cells[ci as usize].cell_type.as_index()] += 1;
                }

                let packed = self.resolve_pixel(&occupant, x as i32, y as i32);
                write_pixel(&mut self.pixel_buffer, offset, packed);
            }
        }

        if selected.is_none() {
            self.selected_id = 0;
        }

        let totals = self.world.soil.totals();
        self.latest_world_data = serde_wasm_bindgen::to_value(&WorldDataDto {
            organic_soil: totals.organic,
            energy_soil: totals.energy,
            organic_poison: totals.organic_poison,
            energy_poison: totals.energy_poison,
            mutations: self.world.genomes.mutation_counter,
            living_cells: self.world.living_count() as u32,
            world_age: self.age,
            world_size: WorldSizeDto {
                width: self.world.grid.width,
                height: self.world.grid.height,
            },
            type_counts,
        })
        .unwrap_or(JsValue::NULL);

        self.latest_selected = match selected {
            Some(dto) => serde_wasm_bindgen::to_value(&dto).unwrap_or(JsValue::NULL),
            None => JsValue::NULL,
        };
    }

    fn resolve_pixel(&self, occupant: &Occupant, x: i32, y: i32) -> u32 {
        match self.view_mode {
            ViewMode::Organic => pack_rgba_u32(&paint_soil_organic(&self.world, x, y)),
            ViewMode::Energy => match occupant {
                Occupant::Cell(ci) => {
                    pack_rgba_u32(&self.world.cells[*ci as usize].energy_color())
                }
                _ => pack_rgba_u32(&paint_soil_energy(&self.world, x, y)),
            },
            ViewMode::Normal => pack_rgba_u32(&self.world.occupant_color(occupant)),
            ViewMode::GenomeHash => match occupant {
                Occupant::Cell(ci) => {
                    pack_rgba_u8(&self.world.cells[*ci as usize].genome_hash_color())
                }
                _ => pack_rgba_u32(&NEUTRAL),
            },
            ViewMode::Coloration => match occupant {
                Occupant::Cell(ci) => pack_rgba_u32(&self.world.cells[*ci as usize].coloration()),
                _ => pack_rgba_u32(&NEUTRAL),
            },
        }
    }

    fn serialize_selected(
        &self,
        occupant: &Occupant,
        x: i32,
        y: i32,
    ) -> Option<SelectedItemDto> {
        match occupant {
            Occupant::Empty => None,
            Occupant::Stone { color, .. } => Some(SelectedItemDto {
                item_type: "Stone".to_string(),
                color: *color,
                cell_type: None,
                energy: None,
                age: None,
                level: None,
                active_gene: None,
                clan_id: None,
                direction: None,
                parent: None,
                genome_index: None,
                gene_bytes: None,
                organic_here: None,
                energy_here: None,
            }),
            Occupant::Cell(ci) => {
                let cell = &self.world.cells[*ci as usize];
                let base = cell.active_gene as usize * BYTES_PER_GENE;
                let gene_bytes = (0..BYTES_PER_GENE)
                    .map(|i| self.world.genomes.get(cell.genome_index, base + i))
                    .collect::<Vec<u8>>();
                Some(SelectedItemDto {
                    item_type: cell.cell_type.name().to_string(),
                    color: cell.color(),
                    cell_type: Some(cell.cell_type.as_u8()),
                    energy: Some(js_round(cell.energy * 100.0) / 100.0),
                    age: Some(cell.age),
                    level: Some(cell.level),
                    active_gene: Some(cell.active_gene),
                    clan_id: Some(cell.clan_id),
                    direction: Some(cell.direction),
                    parent: Some(cell.parent),
                    genome_index: Some(cell.genome_index),
                    gene_bytes: Some(gene_bytes),
                    organic_here: Some(self.world.soil.get_organic(x, y)),
                    energy_here: Some(self.world.soil.get_energy(x, y)),
                })
            }
        }
    }
}

#[inline]
fn write_pixel(buffer: &mut [u8], offset: usize, packed: u32) {
    buffer[offset] = (packed & 0xff) as u8;
    buffer[offset + 1] = ((packed >> 8) & 0xff) as u8;
    buffer[offset + 2] = ((packed >> 16) & 0xff) as u8;
    buffer[offset + 3] = ((packed >> 24) & 0xff) as u8;
}

fn paint_soil_organic(world: &World, x: i32, y: i32) -> Rgba {
    let o = world.soil.get_organic(x, y);
    if o >= ORGANIC_EXCESS {
        return POISON_ORGANIC_COLOR;
    }
    let mut color = EMPTY;
    let t = (o as f64 / ORGANIC_EXCESS as f64).min(1.0) as f32;
    lerp_rgba(&mut color, &ORGANIC_FULL, t);
    color[3] = 255.0;
    color
}

fn paint_soil_energy(world: &World, x: i32, y: i32) -> Rgba {
    let e = world.soil.get_energy(x, y);
    if e >= ENERGY_EXCESS {
        return POISON_ENERGY_COLOR;
    }
    let mut color = EMPTY;
    let t = (e / ENERGY_EXCESS).min(1.0) as f32;
    lerp_rgba(&mut color, &ENERGY_FULL, t);
    color[3] = 255.0;
    color
}

/// JS `Math.round` (halves round toward +∞).
#[inline]
fn js_round(v: f64) -> f64 {
    (v + 0.5).floor()
}

/// Kept so the `CellType` ordering assumptions stay checked at compile time.
const _: () = {
    assert!(CellType::Apex as u8 == 0);
    assert!(CellType::Seed as u8 == 5);
};
