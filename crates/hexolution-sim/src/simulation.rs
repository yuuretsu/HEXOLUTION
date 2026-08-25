use crate::cell::Cell;
use crate::color::{pack_rgba_u32, pack_rgba_u8};
use crate::config::Config;
use crate::rng;
use crate::world::World;
use js_sys::{Object, Reflect, Uint8Array};
use serde::Serialize;
use wasm_bindgen::prelude::*;

#[derive(Clone, Copy, PartialEq, Eq)]
enum ViewMode {
    Normal,
    Energy,
    GenomeHash,
    Coloration,
}

impl ViewMode {
    fn parse(s: &str) -> Self {
        match s {
            "energy" => Self::Energy,
            "genome-hash" => Self::GenomeHash,
            "coloration" => Self::Coloration,
            _ => Self::Normal,
        }
    }
}

#[derive(Serialize)]
struct WorldDataDto {
    #[serde(rename = "worldEnergy")]
    world_energy: i32,
    #[serde(rename = "creaturesEnergy")]
    creatures_energy: i32,
    #[serde(rename = "foodEnergy")]
    food_energy: i32,
    #[serde(rename = "worldAge")]
    world_age: u64,
    #[serde(rename = "worldSize")]
    world_size: WorldSizeDto,
    #[serde(rename = "worldEntries")]
    world_entries: Vec<(String, u32)>,
}

#[derive(Serialize)]
struct WorldSizeDto {
    width: i32,
    height: i32,
}

#[derive(Serialize)]
struct SelectedItemDto {
    #[serde(rename = "type")]
    item_type: String,
    color: [f32; 4],
    #[serde(skip_serializing_if = "Option::is_none")]
    direction: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    program: Option<Vec<u8>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pointer: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    age: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    energy: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    coloration: Option<[f32; 4]>,
}

#[derive(Serialize)]
struct ObjectAtDto {
    #[serde(rename = "type")]
    item_type: String,
    color: [f32; 4],
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
        if config.genome_length == 0 {
            return Err(JsValue::from_str("genomeLength must be positive"));
        }

        let width = config.world_width;
        let height = config.world_height;
        let mut world = World::new(config);
        world.populate();
        let pixel_len = (width * height * 4) as usize;
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
                let item = self.world.grid.get(x.floor() as i32, y.floor() as i32);
                self.selected_id = item.id();
            }
            _ => {
                self.selected_id = 0;
            }
        }
        self.update_selected_js();
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

    /// Run one simulation step (random cell sampling). Render is driven by getLatestFrame.
    pub fn tick(&mut self) {
        if self.speed_multiplier <= 0.0 {
            return;
        }
        let width = self.world.grid.width;
        let height = self.world.grid.height;
        let iterations = (width as f64) * (height as f64) * self.speed_multiplier;
        let mut i = 0.0;
        while i < iterations {
            let x = rng::random_floor(&mut self.world.rng, width);
            let y = rng::random_floor(&mut self.world.rng, height);
            self.age += 1;
            self.world.process_at(x, y);
            i += 1.0;
        }
    }

    #[wasm_bindgen(js_name = getLatestFrame)]
    pub fn get_latest_frame(&mut self) -> JsValue {
        self.render_internal();
        let buffer = Uint8Array::new_with_length(self.pixel_buffer.len() as u32);
        buffer.copy_from(&self.pixel_buffer);
        let obj = Object::new();
        Reflect::set(&obj, &"buffer".into(), &buffer.buffer()).ok();
        Reflect::set(
            &obj,
            &"width".into(),
            &JsValue::from(self.world.grid.width),
        )
        .ok();
        Reflect::set(
            &obj,
            &"height".into(),
            &JsValue::from(self.world.grid.height),
        )
        .ok();
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
        let item = self.world.grid.get(x.floor() as i32, y.floor() as i32);
        if matches!(item, Cell::Empty) {
            return JsValue::NULL;
        }
        serde_wasm_bindgen::to_value(&ObjectAtDto {
            item_type: item.class_name().to_string(),
            color: item.color(&self.world.config),
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
        let cfg = self.world.config.clone();
        let mut empty = 0u32;
        let mut stone = 0u32;
        let mut food = 0u32;
        let mut creature = 0u32;
        let mut creatures_energy = 0i32;
        let mut food_energy = 0i32;
        let mut selected: Option<SelectedItemDto> = None;

        for y in 0..height {
            for x in 0..width {
                let item = self.world.grid.get(x as i32, y as i32);
                let index = y * width + x;
                let pixel_offset = index * 4;

                if matches!(item, Cell::Empty) {
                    empty += 1;
                    self.pixel_buffer[pixel_offset..pixel_offset + 4].fill(0);
                    continue;
                }

                if self.selected_id != 0 && item.id() == self.selected_id {
                    selected = Some(serialize_selected(item, &cfg));
                }

                match item {
                    Cell::Stone(_) => stone += 1,
                    Cell::Food(f) => {
                        food += 1;
                        food_energy += f.energy;
                    }
                    Cell::Creature(c) => {
                        creature += 1;
                        creatures_energy += c.energy;
                    }
                    Cell::Empty => {}
                }

                let packed = match self.view_mode {
                    ViewMode::Normal => pack_rgba_u32(&item.color(&cfg)),
                    ViewMode::Energy => pack_rgba_u32(&item.energy_color(&cfg)),
                    ViewMode::GenomeHash => pack_rgba_u8(&item.genome_hash_color()),
                    ViewMode::Coloration => pack_rgba_u32(&item.coloration()),
                };
                self.pixel_buffer[pixel_offset] = (packed & 0xff) as u8;
                self.pixel_buffer[pixel_offset + 1] = ((packed >> 8) & 0xff) as u8;
                self.pixel_buffer[pixel_offset + 2] = ((packed >> 16) & 0xff) as u8;
                self.pixel_buffer[pixel_offset + 3] = 255;
            }
        }

        if selected.is_none() {
            self.selected_id = 0;
        }

        let mut entries = vec![
            ("Empty".to_string(), empty),
            ("Stone".to_string(), stone),
            ("Food".to_string(), food),
            ("Creature".to_string(), creature),
        ];
        entries.sort_by(|a, b| b.1.cmp(&a.1));
        entries.truncate(5);

        self.latest_world_data = serde_wasm_bindgen::to_value(&WorldDataDto {
            world_energy: self.world.energy,
            creatures_energy,
            food_energy,
            world_age: self.age,
            world_size: WorldSizeDto {
                width: self.world.grid.width,
                height: self.world.grid.height,
            },
            world_entries: entries,
        })
        .unwrap_or(JsValue::NULL);

        self.latest_selected = match selected {
            Some(s) => serde_wasm_bindgen::to_value(&s).unwrap_or(JsValue::NULL),
            None => JsValue::NULL,
        };
    }

    fn update_selected_js(&mut self) {
        if self.selected_id == 0 {
            self.latest_selected = JsValue::NULL;
            return;
        }
        let cfg = self.world.config.clone();
        for cell in self.world.grid.cells() {
            if cell.id() == self.selected_id {
                self.latest_selected = serde_wasm_bindgen::to_value(&serialize_selected(cell, &cfg))
                    .unwrap_or(JsValue::NULL);
                return;
            }
        }
        self.selected_id = 0;
        self.latest_selected = JsValue::NULL;
    }
}

fn serialize_selected(item: &Cell, cfg: &Config) -> SelectedItemDto {
    match item {
        Cell::Creature(c) => SelectedItemDto {
            item_type: "Creature".to_string(),
            color: c.color,
            direction: Some(c.direction),
            program: Some(c.tape.data.clone()),
            pointer: Some(c.tape.pointer),
            age: Some(c.age),
            energy: Some(c.energy),
            coloration: Some(c.coloration),
        },
        other => SelectedItemDto {
            item_type: other.class_name().to_string(),
            color: other.color(cfg),
            direction: None,
            program: None,
            pointer: None,
            age: None,
            energy: None,
            coloration: None,
        },
    }
}
