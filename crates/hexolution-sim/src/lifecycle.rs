//! Link teardown, death and movement (port of `clans/lifecycle.ts`).

use crate::constants::MOVE_APEX_COST;
use crate::directions::invert_dir;
use crate::energy_network::transmit_energy;
use crate::sensors::{cell_at_abs, coords_at_abs};
use crate::world::{Occupant, World};

pub fn destroy_all_links(world: &mut World, ci: usize) {
    let (x, y) = (world.cells[ci].x, world.cells[ci].y);

    for d in 0..6 {
        if world.cells[ci].children[d] == 1 {
            if let Some(child) = cell_at_abs(world, x, y, d as i32) {
                world.cells[child].parent = -1;
            }
            world.cells[ci].children[d] = 0;
        }
    }
    for d in 0..6 {
        if let Some(neighbor) = cell_at_abs(world, x, y, d as i32) {
            world.cells[neighbor].energy_flow[invert_dir(d as i32) as usize] = 0;
        }
    }
    let parent = world.cells[ci].parent;
    if parent != -1 {
        if let Some(pi) = cell_at_abs(world, x, y, parent) {
            world.cells[pi].children[invert_dir(parent) as usize] = 0;
        }
    }
    world.cells[ci].parent = -1;
}

pub fn die(world: &mut World, ci: usize) {
    transmit_energy(world, ci);

    let (x, y, organic_mass, energy, energy_plus, energy_minus) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.organic_mass, c.energy, c.energy_plus, c.energy_minus)
    };

    let mut neighbors = [(0i32, 0i32); 6];
    for d in 0..6 {
        neighbors[d] = world.grid.coords_by_narrow(x, y, d as i32, 1);
    }
    world.soil.distribute_organic(x, y, organic_mass, &neighbors);
    world
        .soil
        .distribute_energy(x, y, energy + energy_plus + energy_minus, &neighbors);

    destroy_all_links(world, ci);
    world.release_cell(ci);

    {
        let c = &mut world.cells[ci];
        c.life = false;
        c.marked_for_death = false;
        c.can_move = false;
        c.parent = -1;
        c.clan_id = 0;
        c.age = 0;
        c.level = 0;
        c.energy = 0.0;
        c.energy_plus = 0.0;
        c.energy_minus = 0.0;
        c.energy_old = 0.0;
        c.children = [0; 6];
        c.energy_flow = [0; 6];
    }

    let (cx, cy) = (world.cells[ci].x, world.cells[ci].y);
    if cx >= 0 && cy >= 0 && *world.grid.get(cx, cy) == Occupant::Cell(ci as u32) {
        world.grid.set(cx, cy, Occupant::Empty);
    }
    world.cells[ci].x = 0;
    world.cells[ci].y = 0;

    let (prev, next) = (world.cells[ci].prev as usize, world.cells[ci].next as usize);
    world.cells[prev].next = next as u32;
    world.cells[next].prev = prev as u32;
    world.cells[ci].next = 0;
    world.cells[ci].prev = 0;
}

pub fn move_seed(world: &mut World, ci: usize) -> bool {
    world.cells[ci].energy -= 1.0;
    let (x, y, direction) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.direction)
    };
    let (nx, ny) = coords_at_abs(world, x, y, direction, 1);

    match *world.grid.get(nx, ny) {
        Occupant::Cell(other) => {
            world.cells[other as usize].marked_for_death = true;
            world.cells[ci].can_move = false;
            return false;
        }
        Occupant::Stone { .. } => {
            world.cells[ci].can_move = false;
            return false;
        }
        Occupant::Empty => {}
    }

    world.grid.set(x, y, Occupant::Empty);
    world.grid.set(nx, ny, Occupant::Cell(ci as u32));
    world.cells[ci].x = nx;
    world.cells[ci].y = ny;
    true
}

pub fn move_apex(world: &mut World, ci: usize) -> bool {
    world.cells[ci].energy -= MOVE_APEX_COST;
    let (x, y, direction) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.direction)
    };
    let (nx, ny) = coords_at_abs(world, x, y, direction, 1);
    if !matches!(*world.grid.get(nx, ny), Occupant::Empty) {
        return false;
    }
    world.grid.set(x, y, Occupant::Empty);
    world.grid.set(nx, ny, Occupant::Cell(ci as u32));
    world.cells[ci].x = nx;
    world.cells[ci].y = ny;
    true
}
