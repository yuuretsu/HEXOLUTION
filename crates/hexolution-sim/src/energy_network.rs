//! Energy absorption / transmission / scatter (port of `clans/energy-network.ts`).

use crate::directions::invert_dir;
use crate::sensors::{cell_at_abs, coords_at_abs};
use crate::world::World;

pub fn absorb_phase_energy(world: &mut World, ci: usize) {
    if world.energy_transport_period == 1 {
        let delta = world.cells[ci].energy_minus;
        world.cells[ci].energy += delta;
        world.cells[ci].energy_minus = 0.0;
    } else {
        let delta = world.cells[ci].energy_plus;
        world.cells[ci].energy += delta;
        world.cells[ci].energy_plus = 0.0;
    }
}

pub fn scatter_organic_around(world: &mut World, ci: usize) {
    let (x, y, energy) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.energy)
    };
    if energy < 12.0 {
        return;
    }
    let share = ((energy - 3.0) / 7.0).floor() as i32;
    world.soil.add_organic(x, y, share);
    for d in 0..6 {
        let (nx, ny) = coords_at_abs(world, x, y, d, 1);
        world.soil.add_organic(nx, ny, share);
    }
    world.cells[ci].energy = 3.0;
}

pub fn transmit_energy(world: &mut World, ci: usize) {
    let (x, y, energy, flow, parent) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.energy, c.energy_flow, c.parent)
    };

    let link_count: i32 = flow.iter().map(|v| *v as i32).sum();

    if link_count > 0 {
        let share = energy / link_count as f64;
        for d in 0..6 {
            if flow[d] != 1 {
                continue;
            }
            let target = match cell_at_abs(world, x, y, d as i32) {
                Some(t) => t,
                None => continue,
            };
            if world.energy_transport_period == 1 {
                world.cells[target].energy_plus += share;
            } else {
                world.cells[target].energy_minus += share;
            }
        }
        world.cells[ci].energy = 0.0;
    } else if parent != -1 {
        world.cells[ci].energy_flow[parent as usize] = 1;
        if let Some(pi) = cell_at_abs(world, x, y, parent) {
            world.cells[pi].energy_flow[invert_dir(parent) as usize] = 0;
        }
    } else {
        world.soil.add_energy(x, y, energy);
        world.cells[ci].age -= 1;
        world.cells[ci].energy = 0.0;
    }
}
