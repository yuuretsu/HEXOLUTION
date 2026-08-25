//! Apex gene interpreter: conditions → commands or growth (port of `clans/apex-program.ts`).

use crate::commands_alone::run_alone_command;
use crate::commands_attached::run_attached_command;
use crate::conditions::test_condition;
use crate::constants::{
    BYTES_PER_GENE, GENES_PER_GENOME, MAX_ALONE_COMMAND, MAX_ATTACHED_COMMAND, SEGMENT_COST,
};

const GENE_WRAP: u8 = GENES_PER_GENOME as u8;
use crate::growth::grow_from_active_gene;
use crate::world::World;

struct GeneJump {
    command_offset: usize,
    success_offset: usize,
    failure_offset: usize,
}

/// Resolve the attached/alone command branch and jump `activeGene`.
fn resolve_command_branch(
    world: &mut World,
    ci: usize,
    gene_base: usize,
    attached: GeneJump,
    alone: GeneJump,
    fallback_offset: usize,
) {
    let g = world.cells[ci].genome_index;

    if world.cells[ci].parent != -1 {
        let command = world.genomes.get(g, gene_base + attached.command_offset);
        if command <= MAX_ATTACHED_COMMAND {
            let ok = run_attached_command(world, ci, command);
            let offset = if ok {
                attached.success_offset
            } else {
                attached.failure_offset
            };
            world.cells[ci].active_gene = (world.genomes.get(g, gene_base + offset) % GENE_WRAP) as u32;
            return;
        }
    }

    if world.cells[ci].parent == -1 {
        let command = world.genomes.get(g, gene_base + alone.command_offset);
        if command <= MAX_ALONE_COMMAND {
            let ok = run_alone_command(world, ci, command);
            let offset = if ok {
                alone.success_offset
            } else {
                alone.failure_offset
            };
            world.cells[ci].active_gene = (world.genomes.get(g, gene_base + offset) % GENE_WRAP) as u32;
            return;
        }
    }

    world.cells[ci].active_gene = (world.genomes.get(g, gene_base + fallback_offset) % GENE_WRAP) as u32;
}

pub fn run_apex_gene_program(world: &mut World, ci: usize) {
    let gene_base = world.cells[ci].active_gene as usize * BYTES_PER_GENE;
    let condition0 = test_condition(world, ci, 0);
    let condition1 = test_condition(world, ci, 1);

    if condition0 + condition1 > 0 {
        resolve_command_branch(
            world,
            ci,
            gene_base,
            GeneJump {
                command_offset: 9,
                success_offset: 10,
                failure_offset: 11,
            },
            GeneJump {
                command_offset: 15,
                success_offset: 16,
                failure_offset: 17,
            },
            7,
        );
        return;
    }

    if condition0 < 0 || condition1 < 0 {
        resolve_command_branch(
            world,
            ci,
            gene_base,
            GeneJump {
                command_offset: 12,
                success_offset: 13,
                failure_offset: 14,
            },
            GeneJump {
                command_offset: 18,
                success_offset: 19,
                failure_offset: 20,
            },
            8,
        );
        return;
    }

    let genome_index = world.cells[ci].genome_index;
    let mut pending = 0i32;
    if world.genomes.get(genome_index, gene_base) <= 95 {
        pending += 1;
    }
    if world.genomes.get(genome_index, gene_base + 1) <= 95 {
        pending += 1;
    }
    if world.genomes.get(genome_index, gene_base + 2) <= 95 {
        pending += 1;
    }
    world.cells[ci].pending_tissue_count = pending;

    if pending == 0 && world.cells[ci].parent == -1 {
        world.cells[ci].active_gene = 0;
        return;
    }

    if pending > 0 {
        let need_energy = (pending * SEGMENT_COST) as f64;
        if world.cells[ci].energy >= need_energy {
            grow_from_active_gene(world, ci);
        }
    }
}
