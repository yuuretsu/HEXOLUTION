use fastrand::Rng;

pub fn new_rng() -> Rng {
    Rng::new()
}

#[inline]
pub fn random_f64(rng: &mut Rng) -> f64 {
    rng.f64()
}

/// Same range semantics as `Math.floor(Math.random() * max)` for `max > 0`.
#[inline]
pub fn random_floor(rng: &mut Rng, max: i32) -> i32 {
    if max <= 0 {
        return 0;
    }
    rng.i32(0..max)
}

#[inline]
pub fn random_base4(rng: &mut Rng) -> u8 {
    rng.u8(0..4)
}
