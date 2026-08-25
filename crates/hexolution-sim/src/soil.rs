//! Soil maps — CLANS3 uses an int organic map and a float energy map.
//! The hex neighborhood replaces the original 3×3 with self + 6 neighbors (7 cells).

use crate::constants::{ENERGY_EXCESS, INITIAL_ORGANIC, INITIAL_SOIL_ENERGY, ORGANIC_EXCESS};

pub struct SoilTotals {
    pub organic: f64,
    pub energy: f64,
    pub organic_poison: u32,
    pub energy_poison: u32,
}

pub struct Soil {
    pub width: i32,
    pub height: i32,
    pub organic: Vec<i32>,
    pub energy: Vec<f32>,
}

impl Soil {
    pub fn new(width: i32, height: i32) -> Self {
        let n = (width as usize) * (height as usize);
        Self {
            width,
            height,
            organic: vec![INITIAL_ORGANIC; n],
            energy: vec![INITIAL_SOIL_ENERGY; n],
        }
    }

    #[inline]
    fn idx(&self, x: i32, y: i32) -> usize {
        let x = x.rem_euclid(self.width);
        let y = y.rem_euclid(self.height);
        (y * self.width + x) as usize
    }

    #[inline]
    pub fn get_organic(&self, x: i32, y: i32) -> i32 {
        self.organic[self.idx(x, y)]
    }

    #[inline]
    pub fn set_organic(&mut self, x: i32, y: i32, value: i32) {
        let i = self.idx(x, y);
        self.organic[i] = value;
    }

    #[inline]
    pub fn add_organic(&mut self, x: i32, y: i32, delta: i32) {
        let i = self.idx(x, y);
        self.organic[i] = self.organic[i].wrapping_add(delta);
    }

    /// Values come out of a `Float32Array`, so they are f32-rounded but used as JS numbers.
    #[inline]
    pub fn get_energy(&self, x: i32, y: i32) -> f64 {
        self.energy[self.idx(x, y)] as f64
    }

    #[inline]
    pub fn set_energy(&mut self, x: i32, y: i32, value: f64) {
        let i = self.idx(x, y);
        self.energy[i] = value as f32;
    }

    #[inline]
    pub fn add_energy(&mut self, x: i32, y: i32, delta: f64) {
        let i = self.idx(x, y);
        self.energy[i] = (self.energy[i] as f64 + delta) as f32;
    }

    /// Diffuse organic into self + 6 hex neighbors (7-cell average, int like CLANS3).
    pub fn distribute_organic(&mut self, x: i32, y: i32, extra: i32, neighbors: &[(i32, i32); 6]) {
        let mut sum = self.get_organic(x, y).wrapping_add(extra);
        for (nx, ny) in neighbors.iter() {
            sum = sum.wrapping_add(self.get_organic(*nx, *ny));
        }
        let n = 1 + neighbors.len() as i32;
        let base = sum / n;
        let rem = sum - base * n;
        for (nx, ny) in neighbors.iter() {
            self.set_organic(*nx, *ny, base);
        }
        self.set_organic(x, y, base + rem);
    }

    pub fn distribute_energy(&mut self, x: i32, y: i32, extra: f64, neighbors: &[(i32, i32); 6]) {
        let mut sum = self.get_energy(x, y) + extra;
        for (nx, ny) in neighbors.iter() {
            sum += self.get_energy(*nx, *ny);
        }
        let n = 1.0 + neighbors.len() as f64;
        let base = sum / n;
        for (nx, ny) in neighbors.iter() {
            self.set_energy(*nx, *ny, base);
        }
        self.set_energy(x, y, base);
    }

    #[inline]
    pub fn is_organic_poison(&self, x: i32, y: i32) -> bool {
        self.get_organic(x, y) >= ORGANIC_EXCESS
    }

    #[inline]
    pub fn is_energy_poison(&self, x: i32, y: i32) -> bool {
        self.get_energy(x, y) >= ENERGY_EXCESS
    }

    pub fn totals(&self) -> SoilTotals {
        let mut organic = 0.0f64;
        let mut energy = 0.0f64;
        let mut organic_poison = 0u32;
        let mut energy_poison = 0u32;
        for i in 0..self.organic.len() {
            let o = self.organic[i];
            let e = self.energy[i] as f64;
            organic += o as f64;
            energy += e;
            if o >= ORGANIC_EXCESS {
                organic_poison += 1;
            }
            if e >= ENERGY_EXCESS {
                energy_poison += 1;
            }
        }
        SoilTotals {
            organic,
            energy,
            organic_poison,
            energy_poison,
        }
    }
}
