use crate::color::{create_random_state, hsla_to_rgba, lerp_rgba, mutate_color, next_random, random_light_color};
use crate::constants::{
    COLORATION_MUTATION_RATE, GENOME_LENGTH, GENOME_MUTATION_RATE, GRAY, MAX_CELL_ENERGY,
};
use crate::js_rng;
use crate::tape::Tape;

#[derive(Clone)]
pub struct Creature {
    pub id: u32,
    pub direction: i32,
    pub tape: Tape,
    pub age: i32,
    pub energy: i32,
    pub color: [f32; 4],
    pub coloration: [f32; 4],
    /// `right` side of the autotroph/heterotroph dichotomy; left = 1 - right.
    pub dichotomy: f64,
    pub genome_hash_color: [u8; 4],
}

impl Creature {
    pub fn new(
        id: u32,
        energy: i32,
        tape: Tape,
        dichotomy: f64,
        color: [f32; 4],
        coloration: Option<[f32; 4]>,
    ) -> Self {
        let coloration = coloration.unwrap_or_else(random_light_color);
        let mut c = Self {
            id,
            direction: js_rng::random_floor(6),
            tape,
            age: 0,
            energy,
            color,
            coloration,
            dichotomy,
            genome_hash_color: [0; 4],
        };
        c.refresh_genome_hash_color();
        c
    }

    pub fn dichotomy_left(&self) -> f64 {
        1.0 - self.dichotomy
    }

    pub fn set_dichotomy_left(&mut self, value: f64) {
        self.dichotomy = 1.0 - value;
    }

    pub fn set_direction(&mut self, value: i32) {
        self.direction = ((value % 6) + 6) % 6;
    }

    pub fn refresh_genome_hash_color(&mut self) {
        let hash = self.tape.hash_string();
        let mut state = create_random_state(&hash);
        let hue = next_random(&mut state) * 360.0;
        self.genome_hash_color = hsla_to_rgba(hue, 100.0, 50.0, 1.0);
    }

    pub fn reproduce(&self, next_id: u32) -> Self {
        let mut data = [0u8; GENOME_LENGTH];
        for i in 0..GENOME_LENGTH {
            data[i] = if js_rng::random() > GENOME_MUTATION_RATE {
                self.tape.data[i]
            } else {
                js_rng::random_base4()
            };
        }

        let mut color = self.color;
        lerp_rgba(&mut color, &GRAY, 0.5);
        let coloration = mutate_color(&self.coloration, COLORATION_MUTATION_RATE);

        let mut child = Self {
            id: next_id,
            direction: js_rng::random_floor(6),
            tape: Tape::from_data(data),
            age: 0,
            energy: 0,
            color,
            coloration,
            dichotomy: self.dichotomy,
            genome_hash_color: [0; 4],
        };
        child.refresh_genome_hash_color();
        child
    }

    pub fn energy_color(&self) -> [f32; 4] {
        let mut c = [0.0, 0.0, 100.0, 255.0];
        lerp_rgba(
            &mut c,
            &crate::constants::ENERGY_COLOR_HOT,
            self.energy as f32 / MAX_CELL_ENERGY as f32,
        );
        c
    }
}

#[derive(Clone)]
pub struct Food {
    pub id: u32,
    pub energy: i32,
}

impl Food {
    pub fn color(&self) -> [f32; 4] {
        let mut c = [25.0, 25.0, 50.0, 0.0];
        let t = (self.energy as f32 / MAX_CELL_ENERGY as f32).powi(2);
        lerp_rgba(&mut c, &crate::constants::FOOD_COLOR_FULL, t);
        c
    }

    pub fn energy_color(&self) -> [f32; 4] {
        let mut c = [0.0, 0.0, 100.0, 255.0];
        lerp_rgba(
            &mut c,
            &crate::constants::ENERGY_COLOR_HOT,
            self.energy as f32 / MAX_CELL_ENERGY as f32,
        );
        c
    }
}

#[derive(Clone)]
pub struct Stone {
    pub id: u32,
    pub color: [f32; 4],
}

impl Stone {
    pub fn new(id: u32) -> Self {
        let br = (js_rng::random().powi(5) * 20.0 + 50.0).floor();
        Self {
            id,
            color: [br as f32, br as f32, br as f32, 255.0],
        }
    }
}

#[derive(Clone)]
pub enum Cell {
    Empty,
    Stone(Stone),
    Food(Food),
    Creature(Creature),
}

impl Cell {
    pub fn class_name(&self) -> &'static str {
        match self {
            Cell::Empty => "Empty",
            Cell::Stone(_) => "Stone",
            Cell::Food(_) => "Food",
            Cell::Creature(_) => "Creature",
        }
    }

    pub fn id(&self) -> u32 {
        match self {
            Cell::Empty => 0,
            Cell::Stone(s) => s.id,
            Cell::Food(f) => f.id,
            Cell::Creature(c) => c.id,
        }
    }

    pub fn color(&self) -> [f32; 4] {
        match self {
            Cell::Empty => [0.0, 0.0, 0.0, 0.0],
            Cell::Stone(s) => s.color,
            Cell::Food(f) => f.color(),
            Cell::Creature(c) => c.color,
        }
    }

    pub fn energy_color(&self) -> [f32; 4] {
        match self {
            Cell::Empty => [0.0, 0.0, 0.0, 0.0],
            Cell::Stone(_) => [100.0, 100.0, 100.0, 255.0],
            Cell::Food(f) => f.energy_color(),
            Cell::Creature(c) => c.energy_color(),
        }
    }

    pub fn genome_hash_color(&self) -> [u8; 4] {
        match self {
            Cell::Creature(c) => c.genome_hash_color,
            _ => [100, 100, 100, 255],
        }
    }

    pub fn coloration(&self) -> [f32; 4] {
        match self {
            Cell::Creature(c) => c.coloration,
            _ => [100.0, 100.0, 100.0, 255.0],
        }
    }
}
