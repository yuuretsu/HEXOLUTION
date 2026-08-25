//! Hex direction helpers (port of `simulation/clans/directions.ts`).

/// Absolute hex direction 0..5 → invert (opposite).
#[inline]
pub fn invert_dir(dir: i32) -> i32 {
    (dir + 3) % 6
}

/// Relative offset (-1, 0, +1, …) → absolute direction 0..5.
#[inline]
pub fn abs_dir(direction: i32, where_: i32) -> i32 {
    (((direction + where_) % 6) + 6) % 6
}

/// Normalize direction into 0..5.
#[inline]
pub fn wrap_dir(dir: i32) -> i32 {
    ((dir % 6) + 6) % 6
}

/// Half-step relative directions snap to the nearest of the 6 hex neighbors.
/// Mirrors JS `Math.round` (halves round toward +∞). Every CLANS3 call site passes
/// an integral offset, so `abs_dir` takes the snapped value directly.
#[allow(dead_code)]
#[inline]
pub fn snap_rel(where_: f64) -> i32 {
    (where_ + 0.5).floor() as i32
}
