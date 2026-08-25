//! Attached-cell genome commands 0–14 (port of `clans/commands-attached.ts`).

use crate::cell_types::CellType;
use crate::energy_network::scatter_organic_around;
use crate::growth::spawn_seed_projectile;
use crate::lifecycle::{destroy_all_links, die};
use crate::rng;
use crate::soil_actions::{move_soil_rel, SoilKind, SoilMode};
use crate::world::World;

fn become_seed(world: &mut World, ci: usize, detach: bool, can_move: bool) -> bool {
    world.cells[ci].cell_type = CellType::Seed;
    if detach {
        destroy_all_links(world, ci);
    }
    world.cells[ci].can_move = can_move;
    world.cells[ci].dormancy = 8;
    true
}

fn soil_push(world: &mut World, ci: usize, where_: i32, kind: SoilKind) {
    let (x, y, direction) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.direction)
    };
    move_soil_rel(world, x, y, direction, where_, kind, SoilMode::Push);
}

/// Returns false when the command failed. Unknown codes succeed (CLANS3 default).
pub fn run_attached_command(world: &mut World, ci: usize, command: u8) -> bool {
    match command {
        0 => true,
        1 => become_seed(world, ci, true, true),
        2 => become_seed(world, ci, false, false),
        3 => become_seed(world, ci, false, true),
        4 => {
            let parent = world.cells[ci].parent;
            if parent != -1 {
                world.cells[ci].energy_flow[parent as usize] = 1;
            }
            die(world, ci);
            true
        }
        5 => {
            destroy_all_links(world, ci);
            true
        }
        6 => {
            soil_push(world, ci, -1, SoilKind::Energy);
            true
        }
        7 => {
            soil_push(world, ci, 1, SoilKind::Energy);
            true
        }
        8 => {
            soil_push(world, ci, 0, SoilKind::Energy);
            true
        }
        9 => {
            soil_push(world, ci, -1, SoilKind::Organic);
            true
        }
        10 => {
            soil_push(world, ci, 1, SoilKind::Organic);
            true
        }
        11 => {
            soil_push(world, ci, 0, SoilKind::Organic);
            true
        }
        12 => spawn_seed_projectile(world, ci, 0, 30),
        13 => {
            let dormancy = 5 + rng::random_floor(&mut world.rng, 40);
            spawn_seed_projectile(world, ci, 1, dormancy)
        }
        14 => {
            scatter_organic_around(world, ci);
            true
        }
        _ => true,
    }
}
