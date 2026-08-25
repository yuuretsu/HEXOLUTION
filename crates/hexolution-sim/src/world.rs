//! World state, pools and the CLANS3 simulation step (port of `simulation/world.ts`
//! plus `worker/world-generator.ts`).

use crate::behaviors::step_cell;
use crate::cell_types::{CellType, Rgba};
use crate::clan_cell::{ClanCell, NewCellOpts};
use crate::config::Config;
use crate::constants::{
    CELL_ORGANIC_COST, INITIAL_APEX_ENERGY, MAX_AGE, SPAWN_STEP, TOTAL_CELL_COUNT,
    TOTAL_GENOME_COUNT,
};
use crate::genome_pool::GenomePool;
use crate::grid::Grid;
use crate::rng;
use crate::soil::Soil;
use fastrand::Rng;

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Occupant {
    Empty,
    Stone { id: u32, color: [f32; 4] },
    /// Index into `World::cells`.
    Cell(u32),
}

impl Occupant {
    pub fn kind(&self) -> &'static str {
        match self {
            Occupant::Empty => "Empty",
            Occupant::Stone { .. } => "Stone",
            Occupant::Cell(_) => "ClanCell",
        }
    }
}

pub struct World {
    pub config: Config,
    pub grid: Grid<Occupant>,
    pub soil: Soil,
    pub genomes: GenomePool,
    pub cells: Vec<ClanCell>,
    pub free_cells: Vec<u32>,
    pub free_cells_pointer: usize,
    pub rng: Rng,
    /// Energy transport phase: +1 or -1 (like `EnergyTransportPeriod`).
    pub energy_transport_period: i32,
    pub steps_counter: u64,
    next_id: u32,
}

impl World {
    pub fn new(config: Config, seed: u64) -> Self {
        let width = config.world_width;
        let height = config.world_height;

        let mut cells = Vec::with_capacity(TOTAL_CELL_COUNT);
        let mut free_cells = Vec::with_capacity(TOTAL_CELL_COUNT);
        for i in 0..TOTAL_CELL_COUNT {
            cells.push(ClanCell::new(i as u32));
            free_cells.push(i as u32);
        }

        Self {
            grid: Grid::new(width, height, Occupant::Empty),
            soil: Soil::new(width, height),
            genomes: GenomePool::new(TOTAL_GENOME_COUNT),
            cells,
            free_cells,
            // 0 is the list sentinel and is never handed out.
            free_cells_pointer: 1,
            rng: rng::new_seeded(seed),
            energy_transport_period: 1,
            steps_counter: 0,
            next_id: 1,
            config,
        }
    }

    pub fn alloc_id(&mut self) -> u32 {
        let id = self.next_id;
        self.next_id = self.next_id.wrapping_add(1).max(1);
        id
    }

    /// Same order as CLANS3 `findFreeCell`: increment, then return the previous slot.
    pub fn find_free_cell(&mut self) -> usize {
        assert!(
            self.free_cells_pointer < TOTAL_CELL_COUNT,
            "cell pool exhausted"
        );
        self.free_cells_pointer += 1;
        self.free_cells[self.free_cells_pointer - 1] as usize
    }

    pub fn release_cell(&mut self, index: usize) {
        self.free_cells_pointer -= 1;
        self.free_cells[self.free_cells_pointer] = index as u32;
    }

    pub fn living_count(&self) -> usize {
        self.free_cells_pointer.saturating_sub(1)
    }

    /// Port of `ClanCell.resetAsNew`.
    pub fn reset_cell_as_new(&mut self, index: usize, opts: NewCellOpts) {
        let id = self.alloc_id();
        {
            let c = &mut self.cells[index];
            c.life = true;
            c.marked_for_death = false;
            c.age = MAX_AGE;
            c.organic_mass = CELL_ORGANIC_COST;
            c.cell_type = opts.cell_type;
            c.level = opts.level;
            c.direction = opts.direction;
            c.parent = opts.parent;
            c.clan_id = opts.clan_id;
            c.active_gene = opts.active_gene;
            c.genome_index = opts.genome_index;
            c.x = opts.x;
            c.y = opts.y;
            c.energy = 0.0;
            c.energy_plus = 0.0;
            c.energy_minus = 0.0;
            c.energy_old = 0.0;
            c.dormancy = 0;
            c.can_move = false;
            c.energy_flow = [0; 6];
            c.children = [0; 6];
            c.id = id;
            c.next = opts.list_insert_before;
            c.prev = opts.list_prev;
        }
        self.cells[opts.list_prev as usize].next = index as u32;
        self.cells[opts.list_insert_before as usize].prev = index as u32;
        self.grid.set(opts.x, opts.y, Occupant::Cell(index as u32));
    }

    /// Full CLANS3 simulation step: all living cells + flip the energy phase.
    pub fn simulation_step(&mut self) {
        self.genomes.refresh_free_list();
        let mut index = self.cells[0].next;
        while index != 0 {
            index = step_cell(self, index as usize);
        }
        self.energy_transport_period *= -1;
        self.steps_counter += 1;
    }

    /// Spawn a lone apex with a random genome (`createNewLife` / `newCell`).
    pub fn spawn_apex(&mut self, x: i32, y: i32, clan_id: u32) -> Option<usize> {
        if !matches!(*self.grid.get(x, y), Occupant::Empty) {
            return None;
        }
        let index = self.find_free_cell();
        let list_insert_before = self.cells[0].next;

        // RNG order matches the TS object literal: direction, then genome bytes.
        let direction = rng::random_floor(&mut self.rng, 6);
        let genome_index = {
            let genomes = &mut self.genomes;
            let rng_ref = &mut self.rng;
            genomes.acquire_random(rng_ref)
        };

        self.reset_cell_as_new(
            index,
            NewCellOpts {
                x,
                y,
                cell_type: CellType::Apex,
                level: 0,
                direction,
                parent: -1,
                clan_id,
                active_gene: 0,
                genome_index,
                list_prev: 0,
                list_insert_before,
            },
        );
        self.cells[index].energy = INITIAL_APEX_ENERGY;
        Some(index)
    }

    pub fn populate(&mut self) {
        let width = self.grid.width;
        let height = self.grid.height;

        for _ in 0..self.config.stone_blob_count {
            let x = rng::random_floor(&mut self.rng, width) as f64;
            let y = rng::random_floor(&mut self.rng, height) as f64;
            let radius = rng::random_f64(&mut self.rng).powi(20) * 40.0 + 30.0;
            self.fill_circle(x, y, radius, true);
            let angle = rng::random_f64(&mut self.rng) * std::f64::consts::PI * 2.0;
            self.fill_circle(
                x + radius * 0.2 * angle.cos(),
                y + radius * 0.2 * angle.sin(),
                radius * 0.9,
                false,
            );
        }

        let mut adam = 1u32;
        let mut x = 0;
        while x < width {
            let mut y = 0;
            while y < height {
                let sx = (width - 1).min(x + (SPAWN_STEP >> 1));
                let sy = (height - 1).min(y);
                if matches!(*self.grid.get(sx, sy), Occupant::Empty) {
                    self.spawn_apex(sx, sy, adam);
                    adam += 1;
                }
                y += SPAWN_STEP;
            }
            x += SPAWN_STEP;
        }
    }

    fn fill_circle(&mut self, sx: f64, sy: f64, sr: f64, place_stone: bool) {
        let hex_aspect = self.config.hex_aspect;
        let radius_squared = sr * sr;
        let radius_ceil_y = (sr / hex_aspect).floor() as i32;

        for y in -radius_ceil_y..=radius_ceil_y {
            let inner = radius_squared - (y as f64 * hex_aspect).powi(2);
            if !(inner >= 0.0) {
                continue;
            }
            let max_x = inner.sqrt().floor() as i32;
            let world_y = self.grid.map_y(sy.floor() as i32 + y);
            for x in -max_x..=max_x {
                let world_x = self.grid.map_x(sx.floor() as i32 + x);
                if place_stone {
                    let id = self.alloc_id();
                    let brightness =
                        (rng::random_f64(&mut self.rng).powi(5) * 20.0 + 50.0).floor() as f32;
                    self.grid.set(
                        world_x,
                        world_y,
                        Occupant::Stone {
                            id,
                            color: [brightness, brightness, brightness, 255.0],
                        },
                    );
                } else {
                    self.grid.set(world_x, world_y, Occupant::Empty);
                }
            }
        }
    }

    pub fn occupant_color(&self, occupant: &Occupant) -> Rgba {
        match occupant {
            Occupant::Cell(i) => self.cells[*i as usize].color(),
            Occupant::Stone { color, .. } => *color,
            Occupant::Empty => [255.0, 0.0, 255.0, 255.0],
        }
    }

    pub fn occupant_id(&self, occupant: &Occupant) -> u32 {
        match occupant {
            Occupant::Cell(i) => self.cells[*i as usize].id,
            Occupant::Stone { id, .. } => *id,
            Occupant::Empty => 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_world(seed: u64) -> World {
        let mut world = World::new(
            Config {
                world_width: 96,
                world_height: 110,
                hex_aspect: 0.866,
                stone_blob_count: 3,
            },
            seed,
        );
        world.populate();
        world
    }

    /// The grid must always agree with the cell records it points at.
    fn assert_grid_consistent(world: &World) {
        for y in 0..world.grid.height {
            for x in 0..world.grid.width {
                if let Occupant::Cell(ci) = *world.grid.get(x, y) {
                    let cell = &world.cells[ci as usize];
                    assert!(cell.life, "grid points at a dead cell at {x},{y}");
                    assert_eq!((cell.x, cell.y), (x, y), "cell coords out of sync");
                }
            }
        }
    }

    /// Walking `next` from the sentinel must return to it and cover every living cell.
    fn assert_list_consistent(world: &World) {
        let mut seen = 0usize;
        let mut index = world.cells[0].next;
        while index != 0 {
            let cell = &world.cells[index as usize];
            assert!(cell.life, "dead cell {index} is still in the living list");
            assert_eq!(world.cells[cell.prev as usize].next, index, "broken prev/next");
            seen += 1;
            assert!(seen <= TOTAL_CELL_COUNT, "living list is cyclic");
            index = cell.next;
        }
        assert_eq!(seen, world.living_count(), "list length vs free-list pointer");
    }

    #[test]
    fn populate_seeds_apexes_and_stones() {
        let world = test_world(1234);
        assert!(world.living_count() > 0, "no apexes were spawned");
        let has_stone = (0..world.grid.height).any(|y| {
            (0..world.grid.width).any(|x| matches!(*world.grid.get(x, y), Occupant::Stone { .. }))
        });
        assert!(has_stone, "no stones were generated");
        assert_grid_consistent(&world);
        assert_list_consistent(&world);
    }

    #[test]
    fn simulation_runs_and_stays_consistent() {
        let mut world = test_world(42);
        for _ in 0..300 {
            world.simulation_step();
        }
        assert_eq!(world.steps_counter, 300);
        assert!(world.living_count() > 0, "the whole population died out");
        assert_grid_consistent(&world);
        assert_list_consistent(&world);
    }

    #[test]
    fn growth_and_mutation_happen() {
        let mut world = test_world(7);
        for _ in 0..300 {
            world.simulation_step();
        }
        let mut counts = [0usize; 6];
        for cell in world.cells.iter().skip(1).filter(|c| c.life) {
            counts[cell.cell_type.as_index()] += 1;
        }
        assert!(
            counts.iter().skip(1).any(|c| *c > 0),
            "apexes never differentiated into other cell types: {counts:?}"
        );
        assert!(world.genomes.mutation_counter > 0, "no mutations recorded");
    }

    #[test]
    fn same_seed_gives_identical_runs() {
        let mut a = test_world(99);
        let mut b = test_world(99);
        for _ in 0..100 {
            a.simulation_step();
            b.simulation_step();
        }
        assert_eq!(a.living_count(), b.living_count());
        assert_eq!(a.genomes.mutation_counter, b.genomes.mutation_counter);
        assert_eq!(a.soil.organic, b.soil.organic);
    }
}

