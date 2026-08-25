//! RNG helpers matching the original TypeScript `Math.random()` usage.

#[inline]
pub fn random() -> f64 {
    js_sys::Math::random()
}

/// `Math.floor(Math.random() * max)` for `max > 0`.
#[inline]
pub fn random_floor(max: i32) -> i32 {
    (random() * max as f64).floor() as i32
}

#[inline]
pub fn random_base4() -> u8 {
    random_floor(4) as u8
}
