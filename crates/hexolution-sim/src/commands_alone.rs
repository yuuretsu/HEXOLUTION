//! Alone-cell genome commands 0–17 (port of `clans/commands-alone.ts`).

use crate::cell_types::CellType;
use crate::constants::ALONE_ENERGY_DRAIN;
use crate::directions::{invert_dir, wrap_dir};
use crate::lifecycle::move_apex;
use crate::rng;
use crate::sensors::cell_at_abs;
use crate::soil_actions::{move_soil_rel, SoilKind, SoilMode};
use crate::world::World;

fn turn_random(world: &mut World, ci: usize) {
    let roll = rng::turn_roll(&mut world.rng);
    if roll <= 3.0 {
        world.cells[ci].direction = wrap_dir(world.cells[ci].direction + 1);
    } else if roll <= 6.0 {
        world.cells[ci].direction = wrap_dir(world.cells[ci].direction - 1);
    }
}

fn turn(world: &mut World, ci: usize, delta: i32) {
    world.cells[ci].direction = wrap_dir(world.cells[ci].direction + delta);
}

fn attach_to_wood(world: &mut World, ci: usize) -> bool {
    let (x, y, direction) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.direction)
    };
    let ahead = match cell_at_abs(world, x, y, direction) {
        Some(a) => a,
        None => return false,
    };
    if world.cells[ahead].cell_type != CellType::Wood {
        return false;
    }
    world.cells[ci].parent = direction;
    let back = invert_dir(direction) as usize;
    world.cells[ahead].energy_flow[back] = 1;
    world.cells[ahead].children[back] = 1;
    true
}

fn devour_soft_neighbors(world: &mut World, ci: usize) -> bool {
    world.cells[ci].energy -= 1.0;
    let (x, y) = (world.cells[ci].x, world.cells[ci].y);
    let mut success = false;
    for dir in 0..6 {
        let other = match cell_at_abs(world, x, y, dir) {
            Some(o) => o,
            None => continue,
        };
        if world.cells[other].cell_type >= CellType::Wood {
            continue;
        }
        success = true;
        world.cells[other].marked_for_death = true;
        let looted = {
            let o = &world.cells[other];
            o.energy + o.energy_plus + o.energy_minus + o.organic_mass as f64
        };
        world.cells[ci].energy += looted;
        let o = &mut world.cells[other];
        o.energy = 0.0;
        o.energy_plus = 0.0;
        o.energy_minus = 0.0;
        o.organic_mass = 0;
    }
    success
}

fn drain_local_energy(world: &mut World, ci: usize) -> bool {
    let (x, y) = (world.cells[ci].x, world.cells[ci].y);
    let available = world.soil.get_energy(x, y);
    if available > ALONE_ENERGY_DRAIN {
        world.cells[ci].energy += ALONE_ENERGY_DRAIN;
        world.soil.add_energy(x, y, -ALONE_ENERGY_DRAIN);
        return true;
    }
    world.cells[ci].energy += available;
    world.soil.set_energy(x, y, 0.0);
    false
}

fn soil_pull(world: &mut World, ci: usize, where_: i32, kind: SoilKind) -> bool {
    let (x, y, direction) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.direction)
    };
    move_soil_rel(world, x, y, direction, where_, kind, SoilMode::Pull)
}

/// Returns false when the command failed. Unknown codes succeed (CLANS3 default).
pub fn run_alone_command(world: &mut World, ci: usize, command: u8) -> bool {
    match command {
        0 => move_apex(world, ci),
        1 => {
            turn(world, ci, 1);
            true
        }
        2 => {
            turn(world, ci, -1);
            true
        }
        3 => {
            turn(world, ci, 3);
            true
        }
        4 => {
            turn(world, ci, 1);
            move_apex(world, ci)
        }
        5 => {
            turn(world, ci, -1);
            move_apex(world, ci)
        }
        6 => {
            turn(world, ci, 3);
            move_apex(world, ci)
        }
        7 => attach_to_wood(world, ci),
        8 => {
            turn_random(world, ci);
            true
        }
        9 => {
            turn_random(world, ci);
            move_apex(world, ci)
        }
        10 => soil_pull(world, ci, -1, SoilKind::Organic),
        11 => soil_pull(world, ci, 0, SoilKind::Organic),
        12 => soil_pull(world, ci, 1, SoilKind::Organic),
        13 => soil_pull(world, ci, -1, SoilKind::Energy),
        14 => soil_pull(world, ci, 0, SoilKind::Energy),
        15 => soil_pull(world, ci, 1, SoilKind::Energy),
        16 => devour_soft_neighbors(world, ci),
        17 => drain_local_energy(world, ci),
        _ => true,
    }
}
