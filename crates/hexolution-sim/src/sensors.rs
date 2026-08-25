//! Read-only neighborhood probes (port of `clans/sensors.ts`).

use crate::cell_types::CellType;
use crate::constants::{ENERGY_EXCESS, ORGANIC_EXCESS, SUN_BASE, SUN_COEFFICIENT};
use crate::directions::abs_dir;
use crate::world::{Occupant, World};

#[inline]
pub fn coords_at_abs(world: &World, x: i32, y: i32, dir: i32, dist: i32) -> (i32, i32) {
    world.grid.coords_by_narrow(x, y, dir, dist)
}

#[inline]
pub fn cell_at_abs(world: &World, x: i32, y: i32, dir: i32) -> Option<usize> {
    let (nx, ny) = coords_at_abs(world, x, y, dir, 1);
    match *world.grid.get(nx, ny) {
        Occupant::Cell(i) => Some(i as usize),
        _ => None,
    }
}

#[inline]
pub fn is_blocked(world: &World, x: i32, y: i32) -> bool {
    !matches!(*world.grid.get(x, y), Occupant::Empty)
}

/// Free for space sensors: empty + not poison.
pub fn is_free_for_growth(world: &World, x: i32, y: i32) -> bool {
    if is_blocked(world, x, y) {
        return false;
    }
    if world.soil.is_organic_poison(x, y) {
        return false;
    }
    if world.soil.is_energy_poison(x, y) {
        return false;
    }
    true
}

pub fn organic_count7(world: &World, x: i32, y: i32) -> i32 {
    let mut sum = world.soil.get_organic(x, y);
    for d in 0..6 {
        let (nx, ny) = coords_at_abs(world, x, y, d, 1);
        sum = sum.wrapping_add(world.soil.get_organic(nx, ny));
    }
    sum
}

pub fn energy_count7(world: &World, x: i32, y: i32) -> f64 {
    let mut sum = world.soil.get_energy(x, y);
    for d in 0..6 {
        let (nx, ny) = coords_at_abs(world, x, y, d, 1);
        sum += world.soil.get_energy(nx, ny);
    }
    sum
}

/// Organic along a relative direction cone (~9 samples).
pub fn find_organic_cone(world: &World, x: i32, y: i32, direction: i32, where_: i32) -> i32 {
    let dir = abs_dir(direction, where_);
    let mut sum = 0i32;
    for dist in 1..=3 {
        let (cx, cy) = coords_at_abs(world, x, y, dir, dist);
        sum = sum.wrapping_add(world.soil.get_organic(cx, cy));
        let (lx, ly) = coords_at_abs(world, cx, cy, (dir + 5) % 6, 1);
        let (rx, ry) = coords_at_abs(world, cx, cy, (dir + 1) % 6, 1);
        sum = sum
            .wrapping_add(world.soil.get_organic(lx, ly))
            .wrapping_add(world.soil.get_organic(rx, ry));
    }
    sum
}

pub fn find_energy_cone(world: &World, x: i32, y: i32, direction: i32, where_: i32) -> f64 {
    let dir = abs_dir(direction, where_);
    let mut sum = 0.0f64;
    for dist in 1..=3 {
        let (cx, cy) = coords_at_abs(world, x, y, dir, dist);
        sum += world.soil.get_energy(cx, cy);
        let (lx, ly) = coords_at_abs(world, cx, cy, (dir + 5) % 6, 1);
        let (rx, ry) = coords_at_abs(world, cx, cy, (dir + 1) % 6, 1);
        sum += world.soil.get_energy(lx, ly) + world.soil.get_energy(rx, ry);
    }
    sum
}

pub fn find_light_ray(world: &World, x: i32, y: i32, direction: i32, where_: i32) -> i32 {
    let dir = abs_dir(direction, where_);
    let mut sum = 0i32;
    for dist in 1..=3 {
        let (cx, cy) = coords_at_abs(world, x, y, dir, dist);
        let o = world.soil.get_organic(cx, cy);
        if o < ORGANIC_EXCESS {
            sum = sum.wrapping_add(o);
        }
    }
    sum
}

pub fn count_free_space_cone(world: &World, x: i32, y: i32, direction: i32, where_: i32) -> i32 {
    let dir = abs_dir(direction, where_);
    let mut res = 0i32;
    for dist in 1..=3 {
        let (cx, cy) = coords_at_abs(world, x, y, dir, dist);
        let (lx, ly) = coords_at_abs(world, cx, cy, (dir + 5) % 6, 1);
        let (rx, ry) = coords_at_abs(world, cx, cy, (dir + 1) % 6, 1);
        if is_free_for_growth(world, cx, cy) {
            res += 1;
        }
        if is_free_for_growth(world, lx, ly) {
            res += 1;
        }
        if is_free_for_growth(world, rx, ry) {
            res += 1;
        }
    }
    res
}

/// Matches CLANS3 `isFreeInRelDirection`, including the original quirk:
/// energy poison is compared to `ORGANIC_EXCESS` (not `ENERGY_EXCESS`).
pub fn is_free_in_rel_direction(
    world: &World,
    x: i32,
    y: i32,
    direction: i32,
    where_: i32,
) -> bool {
    let dir = abs_dir(direction, where_);
    let (nx, ny) = coords_at_abs(world, x, y, dir, 1);
    if is_blocked(world, nx, ny) {
        return false;
    }
    if world.soil.get_organic(nx, ny) >= ORGANIC_EXCESS {
        return false;
    }
    if world.soil.get_energy(nx, ny) >= ORGANIC_EXCESS as f64 {
        return false;
    }
    true
}

pub fn poison_in_relative_direction(
    world: &World,
    x: i32,
    y: i32,
    direction: i32,
    where_: i32,
    what: i32,
) -> bool {
    let dir = abs_dir(direction, where_);
    let (nx, ny) = coords_at_abs(world, x, y, dir, 1);
    if what == 0 {
        return world.soil.get_organic(nx, ny) >= ORGANIC_EXCESS;
    }
    if what == 1 {
        return world.soil.get_energy(nx, ny) >= ENERGY_EXCESS;
    }
    world.soil.get_organic(nx, ny) >= ORGANIC_EXCESS
        || world.soil.get_energy(nx, ny) >= ENERGY_EXCESS
}

pub fn calculate_sun_energy(world: &World, x: i32, y: i32) -> f64 {
    let mut light = SUN_BASE;
    for d in 0..6 {
        if let Some(ni) = cell_at_abs(world, x, y, d) {
            if world.cells[ni].cell_type == CellType::Leaf {
                return 0.0;
            }
            light -= 1;
        }
    }
    world.soil.get_organic(x, y) as f64 * light as f64 * SUN_COEFFICIENT
}
