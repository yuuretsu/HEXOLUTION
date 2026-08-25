use crate::cell::Cell;
use crate::color::{coloration_diff, lerp, lerp_rgba};
use crate::world::World;

/// Number of gene handlers — structural, not a gameplay setting.
const GENE_COUNT: usize = 10;

#[derive(Clone, Copy)]
enum ScanCategory {
    Empty,
    Friend,
    Enemy,
    Food,
    Stone,
}

/// Gene order matches the TypeScript `GENES` table in `gene-ui.ts`.
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
    let cost = world.config.move_energy_cost;
    let color = world.config.color_move_forward;
    let Some(mut creature) = world.take_creature(x, y) else {
        return (true, x, y);
    };
    lerp_rgba(&mut creature.color, &color, 0.01);
    World::send_energy(&mut creature.energy, &mut world.energy, cost);
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
    let cost = world.config.reproduce_energy_cost;
    let min_energy = world.config.reproduce_min_energy;
    let Some(mut parent) = world.take_creature(x, y) else {
        return;
    };
    let amount = parent.tape.read_float();
    World::send_energy(&mut parent.energy, &mut world.energy, cost);
    if parent.energy < min_energy {
        world.put_creature(x, y, parent);
        return;
    }
    let (tx, ty) = world.grid.coords_by_narrow(x, y, parent.direction, 1);
    if !matches!(world.grid.get(tx, ty), Cell::Empty) {
        world.put_creature(x, y, parent);
        return;
    }
    let child_id = world.alloc_id();
    let mut child = parent.reproduce(child_id, &world.config);
    let transfer = ((parent.energy as f64) * amount).round() as i32;
    World::send_energy(&mut parent.energy, &mut child.energy, transfer);
    world.put_creature(x, y, parent);
    world.put_creature(tx, ty, child);
}

fn absorb_light(world: &mut World, x: i32, y: i32) {
    let cost = world.config.photosynthesis_energy_cost;
    let abundance_ratio = world.config.photosynthesis_abundance_ratio;
    let max_yield = world.config.photosynthesis_max_yield;
    let learn_rate = world.config.specialization_learn_rate;
    let color = world.config.color_photosynthesis;
    let total_energy = world.total_energy;

    let Some(mut creature) = world.take_creature(x, y) else {
        return;
    };
    lerp_rgba(&mut creature.color, &color, 0.01);
    World::send_energy(&mut creature.energy, &mut world.energy, cost);
    let left = creature.dichotomy_left();
    let abundance = (world.energy as f64 / (total_energy as f64 * abundance_ratio))
        .min(1.0)
        .powi(2);
    let e = (max_yield * abundance * left.powi(2)).round() as i32;
    creature.set_dichotomy_left(lerp(left, 1.0, learn_rate));
    World::send_energy(&mut world.energy, &mut creature.energy, e);
    world.put_creature(x, y, creature);
}

fn attack_forward(world: &mut World, x: i32, y: i32) {
    let cost = world.config.attack_energy_cost;
    let max_strength = world.config.attack_max_strength;
    let learn_rate = world.config.specialization_learn_rate;
    let color = world.config.color_attack;

    let Some(mut creature) = world.take_creature(x, y) else {
        return;
    };
    lerp_rgba(&mut creature.color, &color, 0.02);
    World::send_energy(&mut creature.energy, &mut world.energy, cost);
    let (tx, ty) = world.grid.coords_by_narrow(x, y, creature.direction, 1);
    if matches!(world.grid.get(tx, ty), Cell::Empty) {
        world.put_creature(x, y, creature);
        return;
    }
    let strength = (max_strength * creature.dichotomy.powi(2)).round() as i32;
    creature.dichotomy = lerp(creature.dichotomy, 1.0, learn_rate);
    let stolen = world.handle_attack(tx, ty, strength);
    creature.energy += stolen;
    world.put_creature(x, y, creature);
}

fn check_self_energy(world: &mut World, x: i32, y: i32) {
    if let Cell::Creature(creature) = world.grid.get_mut(x, y) {
        let threshold = creature.tape.read_float();
        let jump_a = creature.tape.read_int();
        let jump_b = creature.tape.read_int();
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

fn classify(target: &Cell, coloration: &[f32; 4], threshold: f64) -> ScanCategory {
    match target {
        Cell::Empty => ScanCategory::Empty,
        Cell::Creature(other) => {
            if coloration_diff(coloration, &other.coloration) > threshold {
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
    let threshold = world.config.friend_coloration_threshold;
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

    let jump = jump_for_scan(classify(&target, &coloration, threshold), jumps);
    if let Cell::Creature(creature) = world.grid.get_mut(x, y) {
        creature.tape.jump(jump);
    }
}

fn inspect_forward(world: &mut World, x: i32, y: i32) {
    let threshold = world.config.friend_coloration_threshold;
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
    let jump = jump_for_scan(classify(&target, &coloration, threshold), jumps);
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
    let cost = world.config.push_energy_cost;
    let color = world.config.color_push;
    let direction = match world.grid.get_mut(x, y) {
        Cell::Creature(creature) => {
            lerp_rgba(&mut creature.color, &color, 0.01);
            creature.direction
        }
        _ => return,
    };
    world.send_energy_from_creature(x, y, cost);
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
