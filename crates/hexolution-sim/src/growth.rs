//! Segment growth and seed projectiles (port of `clans/growth.ts`).

use crate::cell_types::CellType;
use crate::clan_cell::NewCellOpts;
use crate::constants::{
    BYTES_PER_GENE, CELL_ORGANIC_COST, GENES_PER_GENOME, GROWTH_WORK_COST,
    MUTATION_CHANCE_PERCENT, SEGMENT_COST,
};
use crate::directions::{abs_dir, invert_dir};
use crate::energy_network::transmit_energy;
use crate::sensors::{coords_at_abs, is_blocked};
use crate::world::{Occupant, World};

pub fn grow_from_active_gene(world: &mut World, ci: usize) {
    let (gene_base, genome_index, level) = {
        let c = &world.cells[ci];
        (c.active_gene as usize * BYTES_PER_GENE, c.genome_index, c.level)
    };
    world.cells[ci].pending_tissue_count = 0;
    world.cells[ci].pending_apex_count = 0;

    for (offset, where_) in [(0usize, -1i32), (1, 0), (2, 1)] {
        let gene_val = world.genomes.get(genome_index, gene_base + offset);
        try_branch(world, ci, where_, gene_val, level);
    }

    let total = {
        let c = &world.cells[ci];
        c.pending_tissue_count + c.pending_apex_count
    };
    world.cells[ci].energy -= (total * SEGMENT_COST) as f64;
    if world.cells[ci].pending_apex_count > 0 {
        transmit_energy(world, ci);
    }
}

fn try_branch(world: &mut World, ci: usize, where_: i32, gene_val: u8, level: i32) {
    if gene_val <= 63 {
        spawn_segment(
            world,
            ci,
            where_,
            (gene_val % GENES_PER_GENOME as u8) as u32,
            level,
            CellType::Apex,
        );
    } else if gene_val <= 75 {
        spawn_segment(world, ci, where_, gene_val as u32, level, CellType::Leaf);
    } else if gene_val <= 85 {
        spawn_segment(world, ci, where_, gene_val as u32, level, CellType::Antenna);
    } else if gene_val <= 95 {
        spawn_segment(world, ci, where_, gene_val as u32, level, CellType::Root);
    }
}

fn spawn_segment(
    world: &mut World,
    ci: usize,
    where_: i32,
    gene: u32,
    level: i32,
    segment_type: CellType,
) {
    // CLANS3 flips the parent to wood before the blocked check — kept as-is.
    world.cells[ci].cell_type = CellType::Wood;

    let (x, y, direction) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.direction)
    };
    let absolute_dir = abs_dir(direction, where_);
    let (nx, ny) = coords_at_abs(world, x, y, absolute_dir, 1);
    if is_blocked(world, nx, ny) {
        return;
    }

    if segment_type == CellType::Apex {
        world.cells[ci].pending_apex_count += 1;
    } else {
        world.cells[ci].pending_tissue_count += 1;
    }

    let (clan_id, genome_index, list_prev) = {
        let c = &world.cells[ci];
        (c.clan_id, c.genome_index, c.prev)
    };

    let new_index = world.find_free_cell();
    world.reset_cell_as_new(
        new_index,
        NewCellOpts {
            x: nx,
            y: ny,
            cell_type: segment_type,
            level: level + 1,
            direction: absolute_dir,
            parent: invert_dir(absolute_dir),
            clan_id,
            active_gene: gene,
            genome_index,
            list_prev,
            list_insert_before: ci as u32,
        },
    );

    world.cells[ci].prev = new_index as u32;

    if segment_type == CellType::Apex {
        let mutated = {
            let genomes = &mut world.genomes;
            let rng = &mut world.rng;
            genomes.maybe_mutate_copy(genome_index, MUTATION_CHANCE_PERCENT, rng)
        };
        world.cells[new_index].genome_index = mutated;
    }

    world.cells[ci].children[absolute_dir as usize] = 1;
    match segment_type {
        CellType::Apex => {
            world.cells[ci].energy_flow[absolute_dir as usize] = 1;
        }
        CellType::Leaf | CellType::Root | CellType::Antenna => {
            world.cells[new_index].energy_flow[invert_dir(absolute_dir) as usize] = 1;
        }
        _ => {}
    }
}

/// Shoot a seed forward (attached commands 12/13).
pub fn spawn_seed_projectile(
    world: &mut World,
    ci: usize,
    energy_mode: i32,
    dormancy: i32,
) -> bool {
    let seed_cost = (CELL_ORGANIC_COST + GROWTH_WORK_COST + 30) as f64;
    if world.cells[ci].energy < seed_cost {
        return false;
    }

    let (x, y, direction, genome_index, clan_id, list_prev) = {
        let c = &world.cells[ci];
        (c.x, c.y, c.direction, c.genome_index, c.clan_id, c.prev)
    };
    let (nx, ny) = coords_at_abs(world, x, y, direction, 1);

    match *world.grid.get(nx, ny) {
        Occupant::Cell(other) => {
            let oi = other as usize;
            if world.cells[oi].genome_index == genome_index {
                world.cells[oi].energy += seed_cost;
            } else {
                world.cells[oi].marked_for_death = true;
            }
            world.cells[ci].energy -= seed_cost;
            return true;
        }
        Occupant::Stone { .. } => return false,
        Occupant::Empty => {}
    }

    let new_index = world.find_free_cell();
    world.reset_cell_as_new(
        new_index,
        NewCellOpts {
            x: nx,
            y: ny,
            cell_type: CellType::Seed,
            level: 0,
            direction,
            parent: -1,
            clan_id,
            active_gene: 0,
            genome_index,
            list_prev,
            list_insert_before: ci as u32,
        },
    );
    world.cells[ci].prev = new_index as u32;
    world.cells[new_index].dormancy = dormancy;
    world.cells[new_index].can_move = true;

    if energy_mode == 0 {
        world.cells[new_index].energy = 30.0;
        world.cells[ci].energy -= seed_cost;
    } else {
        let remaining = world.cells[ci].energy - seed_cost;
        world.cells[new_index].energy = remaining;
        world.cells[ci].energy = 30.0;
    }
    true
}
