//! Shared tissue metabolism and harvesting (port of `clans/tissue-metabolism.ts`).

use crate::constants::{ANTENNA_DRAIN, ROOT_DRAIN, TISSUE_ENERGY_PER_STEP};
use crate::energy_network::transmit_energy;
use crate::lifecycle::die;
use crate::world::World;

/// Shared leaf/root/antenna/wood energy tick after optional harvest.
pub fn apply_tissue_metabolism(
    world: &mut World,
    ci: usize,
    next_index: u32,
    die_if_alone: bool,
) -> u32 {
    world.cells[ci].energy -= TISSUE_ENERGY_PER_STEP;
    if world.cells[ci].energy < 0.0 {
        world.cells[ci].age -= 1;
        world.cells[ci].energy = 0.0;
    } else {
        transmit_energy(world, ci);
    }
    let (age, parent) = {
        let c = &world.cells[ci];
        (c.age, c.parent)
    };
    if age <= 0 || (die_if_alone && parent == -1) {
        die(world, ci);
    }
    next_index
}

pub fn harvest_root_organic(world: &mut World, ci: usize) {
    let (x, y) = (world.cells[ci].x, world.cells[ci].y);
    let available = world.soil.get_organic(x, y);
    if available >= ROOT_DRAIN {
        world.cells[ci].energy += ROOT_DRAIN as f64;
        world.soil.add_organic(x, y, -ROOT_DRAIN);
        return;
    }
    world.cells[ci].energy += available as f64;
    world.soil.set_organic(x, y, 0);
}

pub fn harvest_antenna_energy(world: &mut World, ci: usize) {
    let (x, y) = (world.cells[ci].x, world.cells[ci].y);
    let available = world.soil.get_energy(x, y);
    if available >= ANTENNA_DRAIN {
        world.cells[ci].energy += ANTENNA_DRAIN;
        world.soil.add_energy(x, y, -ANTENNA_DRAIN);
        return;
    }
    world.cells[ci].energy += available;
    world.soil.set_energy(x, y, 0.0);
}
