//! Deterministic RNG wrappers. Every CLANS3 `Math.random()` site goes through here;
//! the generator is seeded once at `World` construction and never calls into JS.

use fastrand::Rng;

pub fn new_seeded(seed: u64) -> Rng {
    Rng::with_seed(seed)
}

/// `Math.random()`
#[inline]
pub fn random_f64(rng: &mut Rng) -> f64 {
    rng.f64()
}

/// `Math.floor(Math.random() * max)` for `max > 0`.
#[inline]
pub fn random_floor(rng: &mut Rng, max: i32) -> i32 {
    if max <= 0 {
        return 0;
    }
    (rng.f64() * max as f64).floor() as i32
}

/// `Math.floor(Math.random() * max)` for `usize` bounds.
#[inline]
pub fn random_floor_usize(rng: &mut Rng, max: usize) -> usize {
    if max == 0 {
        return 0;
    }
    (rng.f64() * max as f64).floor() as usize
}

/// `(Math.random() * 256) | 0`
#[inline]
pub fn random_byte(rng: &mut Rng) -> u8 {
    (rng.f64() * 256.0).floor() as u8
}

/// `Math.random() * 100` — mutation chance roll.
#[inline]
pub fn random_percent(rng: &mut Rng) -> f64 {
    rng.f64() * 100.0
}

/// `Math.random() * 256` — condition 25 roll.
#[inline]
pub fn random_256(rng: &mut Rng) -> f64 {
    rng.f64() * 256.0
}

/// `Math.random() * 10` — `turnRandom` roll.
#[inline]
pub fn turn_roll(rng: &mut Rng) -> f64 {
    rng.f64() * 10.0
}
