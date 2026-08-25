use crate::cell::Cell;
use crate::color::{coloration_diff, lerp, lerp_rgba};
use crate::constants::*;
use crate::world::World;

#[derive(Clone, Copy)]
enum ScanCategory {
    Empty,
    Friend,
    Enemy,
    Food,
    Stone,
}

/// Gene order matches JS `Object.values(GeneLibrary)` export order.
/// Returns `(is_finished, x, y)` — position may change after `moveForward`.
pub fn run_gene(index: u8, world: &mut World, x: i32, y: i32) -> (bool, i32, i32) {
    match (index as usize) % GENE_COUNT {
        0 => move_forward(world, x, y),
        1 => {
            rotate_right(world, x, y);
            (false, x, y)
        }
        2 => {
            reproduce(world, x, y);
            (true, x, y)
        }
        3 => {
            absorb_light(world, x, y);
            (true, x, y)
        }
        4 => {
            attack_forward(world, x, y);
            (true, x, y)
        }
        5 => {
            check_self_energy(world, x, y);
            (false, x, y)
        }
        6 => {
            scan_forward(world, x, y);
            (false, x, y)
        }
        7 => {
            inspect_forward(world, x, y);
            (false, x, y)
        }
        8 => {
            reset_genome_pointer(world, x, y);
            (true, x, y)
        }
        9 => {
            displace_forward(world, x, y);
            (true, x, y)
        }
        _ => (true, x, y),
    }
}

fn move_forward(world: &mut World, x: i32, y: i32) -> (bool, i32, i32) {
    let Some(mut creature) = world.take_creature(x, y) else {
        return (true, x, y);
    };
    lerp_rgba(&mut creature.color, &COLOR_MOVE_FORWARD, 0.01);
    World::send_energy(&mut creature.energy, &mut world.energy, MOVE_ENERGY_COST);
    let (tx, ty) = world.grid.coords_by_narrow(x, y, creature.direction, 1);
    if !matches!(world.grid.get(tx, ty), Cell::Empty) {
        world.put_creature(x, y, creature);
        return (true, x, y);
    }
    world.put_creature(tx, ty, creature);
    (true, tx, ty)
}

fn rotate_right(world: &mut World, x: i32, y: i32) {
    if let Cell::Creature(creature) = world.grid.get_mut(x, y) {
        creature.set_direction(creature.direction + 1);
    }
}

fn reproduce(world: &mut World, x: i32, y: i32) {
    let Some(mut parent) = world.take_creature(x, y) else {
        return;
    };
    let amount = parent.tape.read_float();
    World::send_energy(&mut parent.energy, &mut world.energy, REPRODUCE_ENERGY_COST);
    if parent.energy < REPRODUCE_MIN_ENERGY {
        world.put_creature(x, y, parent);
        return;
    }
    let (tx, ty) = world.grid.coords_by_narrow(x, y, parent.direction, 1);
    if !matches!(world.grid.get(tx, ty), Cell::Empty) {
        world.put_creature(x, y, parent);
        return;
    }
    let child_id = world.alloc_id();
    let mut child = parent.reproduce(child_id);
    let transfer = ((parent.energy as f64) * amount).round() as i32;
    World::send_energy(&mut parent.energy, &mut child.energy, transfer);
    world.put_creature(x, y, parent);
    world.put_creature(tx, ty, child);
}

fn absorb_light(world: &mut World, x: i32, y: i32) {
    let Some(mut creature) = world.take_creature(x, y) else {
        return;
    };
    lerp_rgba(&mut creature.color, &COLOR_PHOTOSYNTHESIS, 0.01);
    World::send_energy(
        &mut creature.energy,
        &mut world.energy,
        PHOTOSYNTHESIS_ENERGY_COST,
    );
    let left = creature.dichotomy_left();
    let abundance = (world.energy as f64
        / (world.total_energy as f64 * PHOTOSYNTHESIS_ABUNDANCE_RATIO))
        .min(1.0)
        .powi(2);
    let e = (PHOTOSYNTHESIS_MAX_YIELD * abundance * left.powi(2)).round() as i32;
    creature.set_dichotomy_left(lerp(left, 1.0, SPECIALIZATION_LEARN_RATE));
    World::send_energy(&mut world.energy, &mut creature.energy, e);
    world.put_creature(x, y, creature);
}

fn attack_forward(world: &mut World, x: i32, y: i32) {
    let Some(mut creature) = world.take_creature(x, y) else {
        return;
    };
    lerp_rgba(&mut creature.color, &COLOR_ATTACK, 0.02);
    World::send_energy(&mut creature.energy, &mut world.energy, ATTACK_ENERGY_COST);
    let (tx, ty) = world.grid.coords_by_narrow(x, y, creature.direction, 1);
    if matches!(world.grid.get(tx, ty), Cell::Empty) {
        world.put_creature(x, y, creature);
        return;
    }
    let strength = (ATTACK_MAX_STRENGTH * creature.dichotomy.powi(2)).round() as i32;
    creature.dichotomy = lerp(creature.dichotomy, 1.0, SPECIALIZATION_LEARN_RATE);
    // Match JS: handleAttack fills a temp `{ energy }`, then sendEnergy(result, creature, …)
    // — stolen energy never passes through the world pool.
    let stolen = world.handle_attack(tx, ty, strength);
    creature.energy += stolen;
    world.put_creature(x, y, creature);
}

fn check_self_energy(world: &mut World, x: i32, y: i32) {
    if let Cell::Creature(creature) = world.grid.get_mut(x, y) {
        let threshold = creature.tape.read_float();
        let jump_a = creature.tape.read_int();
        let jump_b = creature.tape.read_int();
        // Matches original JS: `creature.energy * 100 < treshold`
        if (creature.energy as f64) * 100.0 < threshold {
            creature.tape.jump(jump_a);
        } else {
            creature.tape.jump(jump_b);
        }
    }
}

fn jump_for_scan(category: ScanCategory, jumps: [u8; 5]) -> u8 {
    match category {
        ScanCategory::Empty => jumps[0],
        ScanCategory::Friend => jumps[1],
        ScanCategory::Enemy => jumps[2],
        ScanCategory::Food => jumps[3],
        ScanCategory::Stone => jumps[4],
    }
}

fn classify(target: &Cell, coloration: &[f32; 4]) -> ScanCategory {
    match target {
        Cell::Empty => ScanCategory::Empty,
        Cell::Creature(other) => {
            if coloration_diff(coloration, &other.coloration) > FRIEND_COLORATION_THRESHOLD {
                ScanCategory::Enemy
            } else {
                ScanCategory::Friend
            }
        }
        Cell::Food(_) => ScanCategory::Food,
        Cell::Stone(_) => ScanCategory::Stone,
    }
}

fn scan_forward(world: &mut World, x: i32, y: i32) {
    let (distance, jumps, direction, coloration) = match world.grid.get_mut(x, y) {
        Cell::Creature(creature) => {
            let distance = (creature.tape.read_float() * 10.0).floor() as i32 + 1;
            let jumps = [
                creature.tape.read_int(),
                creature.tape.read_int(),
                creature.tape.read_int(),
                creature.tape.read_int(),
                creature.tape.read_int(),
            ];
            (distance, jumps, creature.direction, creature.coloration)
        }
        _ => return,
    };

    let mut target = Cell::Empty;
    for d in 1..=distance {
        let (cx, cy) = world.grid.coords_by_narrow(x, y, direction, d);
        let cell = world.grid.get(cx, cy);
        if !matches!(cell, Cell::Empty) {
            target = cell.clone();
            break;
        }
    }

    let jump = jump_for_scan(classify(&target, &coloration), jumps);
    if let Cell::Creature(creature) = world.grid.get_mut(x, y) {
        creature.tape.jump(jump);
    }
}

fn inspect_forward(world: &mut World, x: i32, y: i32) {
    let (jumps, direction, coloration) = match world.grid.get_mut(x, y) {
        Cell::Creature(creature) => {
            let jumps = [
                creature.tape.read_int(),
                creature.tape.read_int(),
                creature.tape.read_int(),
                creature.tape.read_int(),
                creature.tape.read_int(),
            ];
            (jumps, creature.direction, creature.coloration)
        }
        _ => return,
    };

    let (cx, cy) = world.grid.coords_by_narrow(x, y, direction, 1);
    let target = world.grid.get(cx, cy).clone();
    let jump = jump_for_scan(classify(&target, &coloration), jumps);
    if let Cell::Creature(creature) = world.grid.get_mut(x, y) {
        creature.tape.jump(jump);
    }
}

fn reset_genome_pointer(world: &mut World, x: i32, y: i32) {
    if let Cell::Creature(creature) = world.grid.get_mut(x, y) {
        creature.tape.pointer = 0;
    }
}

fn displace_forward(world: &mut World, x: i32, y: i32) {
    let direction = match world.grid.get_mut(x, y) {
        Cell::Creature(creature) => {
            lerp_rgba(&mut creature.color, &COLOR_PUSH, 0.01);
            creature.direction
        }
        _ => return,
    };
    world.send_energy_from_creature(x, y, PUSH_ENERGY_COST);
    let (fwd_x, fwd_y) = world.grid.coords_by_narrow(x, y, direction, 1);
    if matches!(world.grid.get(fwd_x, fwd_y), Cell::Empty) {
        return;
    }
    let (bwd_x, bwd_y) = world.grid.coords_by_narrow(x, y, (direction + 3) % 6, 1);
    if !matches!(world.grid.get(bwd_x, bwd_y), Cell::Empty) {
        return;
    }
    world.grid.swap(fwd_x, fwd_y, bwd_x, bwd_y);
}
