//! Pooled cell record (port of `clans/cell.ts` state).

use crate::cell_types::{CellType, Rgba};
use crate::color::{create_random_state, hsla_to_rgba, lerp_rgba, next_random};
use crate::constants::MAX_APEX_ENERGY;

const ENERGY_COLD: Rgba = [0.0, 0.0, 100.0, 255.0];
const ENERGY_HOT: Rgba = [255.0, 255.0, 0.0, 255.0];

#[derive(Clone)]
pub struct ClanCell {
    pub id: u32,
    pub life: bool,
    pub marked_for_death: bool,
    pub cell_type: CellType,
    /// Own pool slot — mirrors CLANS3 `ClanCell.index`; the pool index is the identity.
    #[allow(dead_code)]
    pub index: u32,
    pub next: u32,
    pub prev: u32,
    pub active_gene: u32,
    pub age: i32,
    pub level: i32,
    pub x: i32,
    pub y: i32,
    pub clan_id: u32,
    pub organic_mass: i32,
    pub direction: i32,
    /// Absolute direction toward parent, or -1 if alone.
    pub parent: i32,
    pub energy: f64,
    pub energy_old: f64,
    pub energy_plus: f64,
    pub energy_minus: f64,
    pub energy_flow: [u8; 6],
    pub children: [u8; 6],
    pub dormancy: i32,
    pub can_move: bool,
    pub genome_index: u32,
    /// Growth bookkeeping for the current apex grow pass.
    pub pending_tissue_count: i32,
    pub pending_apex_count: i32,
}

impl ClanCell {
    pub fn new(index: u32) -> Self {
        Self {
            id: 0,
            life: false,
            marked_for_death: false,
            cell_type: CellType::Apex,
            index,
            next: 0,
            prev: 0,
            active_gene: 0,
            age: 0,
            level: 0,
            x: -1,
            y: -1,
            clan_id: 0,
            organic_mass: 0,
            direction: 0,
            parent: -1,
            energy: 0.0,
            energy_old: 0.0,
            energy_plus: 0.0,
            energy_minus: 0.0,
            energy_flow: [0; 6],
            children: [0; 6],
            dormancy: 0,
            can_move: false,
            genome_index: 0,
            pending_tissue_count: 0,
            pending_apex_count: 0,
        }
    }

    pub fn color(&self) -> Rgba {
        self.cell_type.color()
    }

    pub fn energy_color(&self) -> Rgba {
        let mut c = ENERGY_COLD;
        let t = (self.energy / MAX_APEX_ENERGY).min(1.0) as f32;
        lerp_rgba(&mut c, &ENERGY_HOT, t);
        c[3] = 255.0;
        c
    }

    pub fn genome_hash_color(&self) -> [u8; 4] {
        let mut state = create_random_state(&self.genome_index.to_string());
        let c = hsla_to_rgba(next_random(&mut state) * 360.0, 100.0, 50.0, 1.0);
        [c[0], c[1], c[2], 255]
    }

    pub fn coloration(&self) -> Rgba {
        self.cell_type.color()
    }
}

/// Arguments for `World::reset_cell_as_new` (port of `ClanCell.resetAsNew` opts).
pub struct NewCellOpts {
    pub x: i32,
    pub y: i32,
    pub cell_type: CellType,
    pub level: i32,
    pub direction: i32,
    pub parent: i32,
    pub clan_id: u32,
    pub active_gene: u32,
    pub genome_index: u32,
    pub list_prev: u32,
    pub list_insert_before: u32,
}
