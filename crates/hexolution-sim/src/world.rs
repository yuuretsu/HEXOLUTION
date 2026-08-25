use crate::cell::{Cell, Creature, Food, Stone};
use crate::config::Config;
use crate::genes;
use crate::grid::Grid;
use crate::rng;
use crate::tape::Tape;
use fastrand::Rng;

pub struct World {
    pub config: Config,
    pub rng: Rng,
    pub grid: Grid<Cell>,
    pub total_energy: i32,
    pub energy: i32,
    next_id: u32,
}

impl World {
    pub fn new(config: Config) -> Self {
        let width = config.world_width;
        let height = config.world_height;
        let total_energy = width * height * config.energy_per_cell;
        Self {
            grid: Grid::new(width, height, Cell::Empty),
            total_energy,
            energy: total_energy,
            next_id: 1,
            rng: rng::new_rng(),
            config,
        }
    }

    pub fn alloc_id(&mut self) -> u32 {
        let id = self.next_id;
        self.next_id = self.next_id.wrapping_add(1).max(1);
        id
    }

    /// Matches original JS `sendEnergy` (no clamp on negative amounts).
    pub fn send_energy(from: &mut i32, to: &mut i32, amount: i32) {
        let energy = (*from).min(amount);
        *from -= energy;
        *to += energy;
    }

    pub fn take_creature(&mut self, x: i32, y: i32) -> Option<Creature> {
        let idx = self.grid.index(x, y);
        match std::mem::replace(&mut self.grid.cells_mut()[idx], Cell::Empty) {
            Cell::Creature(c) => Some(c),
            other => {
                self.grid.cells_mut()[idx] = other;
                None
            }
        }
    }

    pub fn put_creature(&mut self, x: i32, y: i32, creature: Creature) {
        self.grid.set(x, y, Cell::Creature(creature));
    }

    /// Mutate a creature in place while also touching world energy (avoids take/put).
    #[inline]
    pub fn with_creature<R>(
        &mut self,
        x: i32,
        y: i32,
        f: impl FnOnce(&mut Creature, &mut i32) -> R,
    ) -> Option<R> {
        let mut energy = self.energy;
        let result = match self.grid.get_mut(x, y) {
            Cell::Creature(c) => Some(f(c, &mut energy)),
            _ => None,
        };
        self.energy = energy;
        result
    }

    pub fn handle_attack(&mut self, x: i32, y: i32, strength: i32) -> i32 {
        let mut energy = self.energy;
        let stolen = match self.grid.get_mut(x, y) {
            Cell::Creature(c) => {
                Self::send_energy(&mut c.energy, &mut energy, 1);
                let mut stolen = 0;
                Self::send_energy(&mut c.energy, &mut stolen, strength);
                stolen
            }
            Cell::Food(f) => {
                let mut stolen = 0;
                Self::send_energy(&mut f.energy, &mut stolen, strength);
                stolen
            }
            _ => 0,
        };
        self.energy = energy;
        stolen
    }

    pub fn process_at(&mut self, x: i32, y: i32) {
        match self.grid.get(x, y) {
            Cell::Creature(_) => self.process_creature(x, y),
            Cell::Food(_) => self.process_food(x, y),
            _ => {}
        }
    }

    fn process_food(&mut self, x: i32, y: i32) {
        let mut energy = self.energy;
        let clear = match self.grid.get_mut(x, y) {
            Cell::Food(f) => {
                Self::send_energy(&mut f.energy, &mut energy, 1);
                f.energy <= 0
            }
            _ => false,
        };
        self.energy = energy;
        if clear {
            self.grid.set(x, y, Cell::Empty);
        }
    }

    fn process_creature(&mut self, mut x: i32, mut y: i32) {
        let max_energy = self.config.max_cell_energy;
        let genes_per_tick = self.config.genes_per_tick;
        let age_factor = self.config.age_energy_cost_factor;

        match self.grid.get(x, y) {
            Cell::Creature(c) if c.energy > 0 && c.energy < max_energy => {}
            Cell::Creature(_) => {
                self.die_creature(x, y);
                return;
            }
            _ => return,
        }

        for _ in 0..genes_per_tick {
            let gene = match self.grid.get_mut(x, y) {
                Cell::Creature(c) => c.tape.read_int(),
                _ => return,
            };
            let (finished, nx, ny) = genes::run_gene(gene, self, x, y);
            x = nx;
            y = ny;
            if finished {
                break;
            }
        }

        self.with_creature(x, y, |c, world_energy| {
            let age_cost = (c.age as f64 * age_factor).floor() as i32;
            Self::send_energy(&mut c.energy, world_energy, age_cost);
            c.age += 1;
        });
    }

    pub fn die_creature(&mut self, x: i32, y: i32) {
        let energy = match self.grid.get_mut(x, y) {
            Cell::Creature(c) => {
                let e = c.energy;
                c.energy = 0;
                e
            }
            _ => return,
        };
        let id = self.alloc_id();
        self.grid.set(x, y, Cell::Food(Food { id, energy }));
    }

    pub fn populate(&mut self) {
        let width = self.grid.width;
        let height = self.grid.height;
        let stone_blobs = self.config.stone_blob_count;
        let spawn_attempts = self.config.creature_spawn_attempts;
        let genome_length = self.config.genome_length;
        let initial_energy = self.config.initial_creature_energy;

        for _ in 0..stone_blobs {
            let x = rng::random_floor(&mut self.rng, width) as f64;
            let y = rng::random_floor(&mut self.rng, height) as f64;
            let radius = rng::random_f64(&mut self.rng).powi(20) * 50.0 + 50.0;
            self.fill_circle(x, y, radius, true);
            let angle = rng::random_f64(&mut self.rng) * std::f64::consts::PI * 2.0;
            self.fill_circle(
                x + radius * 0.2 * angle.cos(),
                y + radius * 0.2 * angle.sin(),
                radius * 0.9,
                false,
            );
        }

        for _ in 0..spawn_attempts {
            let x = rng::random_floor(&mut self.rng, width);
            let y = rng::random_floor(&mut self.rng, height);
            if matches!(self.grid.get(x, y), Cell::Empty) {
                let id = self.alloc_id();
                let tape = Tape::random(genome_length, &mut self.rng);
                let dichotomy = rng::random_f64(&mut self.rng);
                let mut creature = Creature::new(
                    id,
                    0,
                    tape,
                    dichotomy,
                    [100.0, 200.0, 100.0, 255.0],
                    None,
                    &mut self.rng,
                );
                Self::send_energy(&mut self.energy, &mut creature.energy, initial_energy);
                self.grid.set(x, y, Cell::Creature(creature));
            }
        }
    }

    fn fill_circle(&mut self, sx: f64, sy: f64, sr: f64, place_stone: bool) {
        let hex_aspect = self.config.hex_aspect;
        let radius_squared = sr * sr;
        let radius_ceil_y = (sr / hex_aspect).floor() as i32;

        for y in -radius_ceil_y..=radius_ceil_y {
            let inner = radius_squared - (y as f64 * hex_aspect).powi(2);
            if inner < 0.0 || inner.is_nan() {
                continue;
            }
            let max_x = inner.sqrt().floor() as i32;
            let world_y = self.grid.map_y(sy.floor() as i32 + y);
            for x in -max_x..=max_x {
                let world_x = self.grid.map_x(sx.floor() as i32 + x);
                if place_stone {
                    let id = self.alloc_id();
                    let stone = Stone::new(id, &mut self.rng);
                    self.grid.set(world_x, world_y, Cell::Stone(stone));
                } else {
                    self.grid.set(world_x, world_y, Cell::Empty);
                }
            }
        }
    }
}
