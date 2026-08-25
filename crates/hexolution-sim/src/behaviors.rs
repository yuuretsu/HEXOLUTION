//! Per-type step behavior (port of `clans/cell-behaviors.ts` + `ClanCell.step`).

use crate::apex_program::run_apex_gene_program;
use crate::cell_types::CellType;
use crate::constants::{
    APEX_ENERGY_PER_STEP, MAX_AGE, MAX_APEX_ENERGY, MAX_SEED_ENERGY, SEED_ENERGY_PER_STEP,
};
use crate::energy_network::absorb_phase_energy;
use crate::lifecycle::{destroy_all_links, die, move_seed};
use crate::sensors::calculate_sun_energy;
use crate::tissue::{apply_tissue_metabolism, harvest_antenna_energy, harvest_root_organic};
use crate::world::World;

#[inline]
fn total_energy(world: &World, ci: usize) -> f64 {
    let c = &world.cells[ci];
    c.energy + c.energy_plus + c.energy_minus
}

#[inline]
pub fn immune_to_organic_poison(cell_type: CellType) -> bool {
    cell_type == CellType::Root
}

#[inline]
pub fn immune_to_energy_poison(cell_type: CellType) -> bool {
    cell_type == CellType::Antenna
}

/// Returns the next living cell index (CLANS3 `ClanCell.step`).
pub fn step_cell(world: &mut World, ci: usize) -> u32 {
    let next_index = world.cells[ci].next;
    world.cells[ci].energy_old = world.cells[ci].energy;
    absorb_phase_energy(world, ci);

    if world.cells[ci].marked_for_death {
        die(world, ci);
        return next_index;
    }

    let (cell_type, x, y) = {
        let c = &world.cells[ci];
        (c.cell_type, c.x, c.y)
    };

    if world.soil.is_organic_poison(x, y) && !immune_to_organic_poison(cell_type) {
        die(world, ci);
        return next_index;
    }
    if world.soil.is_energy_poison(x, y) && !immune_to_energy_poison(cell_type) {
        die(world, ci);
        return next_index;
    }

    match cell_type {
        CellType::Apex => step_apex(world, ci, next_index),
        CellType::Leaf => step_leaf(world, ci, next_index),
        CellType::Antenna => step_antenna(world, ci, next_index),
        CellType::Root => step_root(world, ci, next_index),
        CellType::Wood => step_wood(world, ci, next_index),
        CellType::Seed => step_seed(world, ci, next_index),
    }
}

fn step_apex(world: &mut World, ci: usize, next_index: u32) -> u32 {
    if total_energy(world, ci) < 0.0 {
        die(world, ci);
        return next_index;
    }
    if world.cells[ci].parent == -1 {
        world.cells[ci].level = 0;
    }

    let genome_index = world.cells[ci].genome_index;
    world.genomes.mark_used(genome_index);
    world.cells[ci].energy -= APEX_ENERGY_PER_STEP;

    if world.cells[ci].energy > MAX_APEX_ENERGY && world.cells[ci].parent != -1 {
        destroy_all_links(world, ci);
        world.cells[ci].active_gene = 0;
        return next_index;
    }

    run_apex_gene_program(world, ci);
    next_index
}

fn step_leaf(world: &mut World, ci: usize, next_index: u32) -> u32 {
    let (x, y) = (world.cells[ci].x, world.cells[ci].y);
    let sun = calculate_sun_energy(world, x, y);
    world.cells[ci].energy += sun;
    apply_tissue_metabolism(world, ci, next_index, true)
}

fn step_root(world: &mut World, ci: usize, next_index: u32) -> u32 {
    harvest_root_organic(world, ci);
    apply_tissue_metabolism(world, ci, next_index, true)
}

fn step_antenna(world: &mut World, ci: usize, next_index: u32) -> u32 {
    harvest_antenna_energy(world, ci);
    apply_tissue_metabolism(world, ci, next_index, true)
}

fn step_wood(world: &mut World, ci: usize, next_index: u32) -> u32 {
    if world.cells[ci].parent == -1 {
        let kids: i32 = world.cells[ci].children.iter().map(|v| *v as i32).sum();
        if kids == 0 {
            die(world, ci);
            return next_index;
        }
    }
    apply_tissue_metabolism(world, ci, next_index, false)
}

fn step_seed(world: &mut World, ci: usize, next_index: u32) -> u32 {
    if total_energy(world, ci) < 0.0 {
        die(world, ci);
        return next_index;
    }
    world.cells[ci].energy -= SEED_ENERGY_PER_STEP;
    if world.cells[ci].energy > MAX_SEED_ENERGY && world.cells[ci].parent != -1 {
        destroy_all_links(world, ci);
    }

    let genome_index = world.cells[ci].genome_index;
    world.genomes.mark_used(genome_index);

    if world.cells[ci].parent == -1 {
        if world.cells[ci].dormancy > 0 {
            world.cells[ci].dormancy -= 1;
            if world.cells[ci].can_move && !move_seed(world, ci) {
                die(world, ci);
                return next_index;
            }
        } else {
            let c = &mut world.cells[ci];
            c.age = MAX_AGE;
            c.active_gene = 0;
            c.cell_type = CellType::Apex;
            c.level = 0;
        }
    }
    next_index
}
