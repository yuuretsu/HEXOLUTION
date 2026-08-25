//! Condition gene codes 0–67 (port of `clans/cell-conditions.ts`).

use crate::cell_types::CellType;
use crate::constants::{BYTES_PER_GENE, MAX_CONDITION_CODE};
use crate::directions::abs_dir;
use crate::rng;
use crate::sensors::{
    cell_at_abs, count_free_space_cone, energy_count7, find_energy_cone, find_light_ray,
    find_organic_cone, is_free_in_rel_direction, organic_count7, poison_in_relative_direction,
};
use crate::world::World;

struct Ctx {
    x: i32,
    y: i32,
    dir: i32,
    level: i32,
    energy: f64,
    energy_old: f64,
    parent: i32,
    param: i32,
}

#[inline]
fn cmp_light(world: &World, c: &Ctx, left: i32, right: i32) -> bool {
    find_light_ray(world, c.x, c.y, c.dir, left) > find_light_ray(world, c.x, c.y, c.dir, right)
}

#[inline]
fn cmp_energy_cone(world: &World, c: &Ctx, left: i32, right: i32) -> bool {
    find_energy_cone(world, c.x, c.y, c.dir, left) > find_energy_cone(world, c.x, c.y, c.dir, right)
}

#[inline]
fn energy_cone_above(world: &World, c: &Ctx, where_: i32) -> bool {
    find_energy_cone(world, c.x, c.y, c.dir, where_) > (c.param * 18) as f64
}

#[inline]
fn cmp_organic_cone(world: &World, c: &Ctx, left: i32, right: i32) -> bool {
    find_organic_cone(world, c.x, c.y, c.dir, left)
        > find_organic_cone(world, c.x, c.y, c.dir, right)
}

#[inline]
fn organic_cone_above(world: &World, c: &Ctx, where_: i32) -> bool {
    find_organic_cone(world, c.x, c.y, c.dir, where_) > c.param * 18
}

#[inline]
fn cmp_free_space(world: &World, c: &Ctx, left: i32, right: i32) -> bool {
    count_free_space_cone(world, c.x, c.y, c.dir, left)
        > count_free_space_cone(world, c.x, c.y, c.dir, right)
}

#[inline]
fn free_space_above(world: &World, c: &Ctx, where_: i32) -> bool {
    count_free_space_cone(world, c.x, c.y, c.dir, where_) > c.param % 10
}

#[inline]
fn free_rel(world: &World, c: &Ctx, where_: i32, expect_free: bool) -> bool {
    is_free_in_rel_direction(world, c.x, c.y, c.dir, where_) == expect_free
}

#[inline]
fn poison_rel(world: &World, c: &Ctx, where_: i32, what: i32) -> bool {
    poison_in_relative_direction(world, c.x, c.y, c.dir, where_, what)
}

fn eval_condition(world: &mut World, code: u8, c: &Ctx) -> bool {
    match code {
        // 0 and 1 are identical in CLANS3.
        0 | 1 => world.soil.get_organic(c.x, c.y) < c.param * 2,
        2 => c.energy > (c.param * 2) as f64,
        3 => c.energy < (c.param * 2) as f64,
        4 => {
            let d = c.level + 1;
            d != 0 && c.param % d == 0
        }
        5 => c.level % (c.param + 1) == 0,
        6 => c.level > c.param,
        7 => c.level < c.param,
        8 => c.energy >= c.energy_old,
        9 => c.energy < c.energy_old,
        10 => organic_count7(world, c.x, c.y) > c.param * 18,
        11 => organic_count7(world, c.x, c.y) < c.param * 18,
        12 => energy_count7(world, c.x, c.y) > (c.param * 18) as f64,
        13 => energy_count7(world, c.x, c.y) < (c.param * 18) as f64,
        14 => energy_count7(world, c.x, c.y) > organic_count7(world, c.x, c.y) as f64,
        15 => energy_count7(world, c.x, c.y) < organic_count7(world, c.x, c.y) as f64,
        16 => {
            for where_ in [-2i32, -1, 0, 1, 2] {
                let dir = abs_dir(c.dir, where_);
                if let Some(ni) = cell_at_abs(world, c.x, c.y, dir) {
                    if world.cells[ni].cell_type < CellType::Wood {
                        return true;
                    }
                }
            }
            false
        }
        17 => {
            is_free_in_rel_direction(world, c.x, c.y, c.dir, -1)
                && is_free_in_rel_direction(world, c.x, c.y, c.dir, 0)
                && is_free_in_rel_direction(world, c.x, c.y, c.dir, 1)
        }
        18 => free_rel(world, c, -1, true),
        19 => free_rel(world, c, 0, true),
        20 => free_rel(world, c, 1, true),
        21 => free_rel(world, c, -1, false),
        22 => free_rel(world, c, 0, false),
        23 => free_rel(world, c, 1, false),
        24 => c.parent != -1,
        25 => rng::random_256(&mut world.rng) > c.param as f64,
        26 => cmp_light(world, c, 0, 1),
        27 => cmp_light(world, c, 1, 0),
        28 => cmp_light(world, c, 0, -1),
        29 => cmp_light(world, c, -1, 0),
        30 => cmp_light(world, c, -1, 1),
        31 => cmp_light(world, c, 1, -1),
        32 => cmp_energy_cone(world, c, 0, 1),
        33 => cmp_energy_cone(world, c, 1, 0),
        34 => cmp_energy_cone(world, c, 0, -1),
        35 => cmp_energy_cone(world, c, -1, 0),
        36 => cmp_energy_cone(world, c, -1, 1),
        37 => cmp_energy_cone(world, c, 1, -1),
        38 => energy_cone_above(world, c, 1),
        39 => energy_cone_above(world, c, 0),
        40 => energy_cone_above(world, c, -1),
        41 => cmp_organic_cone(world, c, 0, 1),
        42 => cmp_organic_cone(world, c, 1, 0),
        43 => cmp_organic_cone(world, c, 0, -1),
        44 => cmp_organic_cone(world, c, -1, 0),
        45 => cmp_organic_cone(world, c, -1, 1),
        46 => cmp_organic_cone(world, c, 1, -1),
        47 => organic_cone_above(world, c, 0),
        48 => organic_cone_above(world, c, 1),
        49 => organic_cone_above(world, c, -1),
        50 => cmp_free_space(world, c, 0, 1),
        51 => cmp_free_space(world, c, 1, 0),
        52 => cmp_free_space(world, c, 0, -1),
        53 => cmp_free_space(world, c, -1, 0),
        54 => cmp_free_space(world, c, -1, 1),
        55 => cmp_free_space(world, c, 1, -1),
        56 => free_space_above(world, c, 0),
        57 => free_space_above(world, c, 1),
        58 => free_space_above(world, c, -1),
        59 => poison_rel(world, c, 0, 0),
        60 => poison_rel(world, c, -1, 0),
        61 => poison_rel(world, c, 1, 0),
        62 => poison_rel(world, c, 0, 1),
        63 => poison_rel(world, c, -1, 1),
        64 => poison_rel(world, c, 1, 1),
        65 => poison_rel(world, c, 0, 2),
        66 => poison_rel(world, c, -1, 2),
        67 => poison_rel(world, c, 1, 2),
        _ => false,
    }
}

/// Returns 0 if the condition gene is inactive, 1 if true, -1 if false.
/// Port of `Cells.testCondition` for hex.
pub fn test_condition(world: &mut World, ci: usize, n: usize) -> i32 {
    let (gene_base, genome_index, ctx_base) = {
        let cell = &world.cells[ci];
        (
            cell.active_gene as usize * BYTES_PER_GENE,
            cell.genome_index,
            (
                cell.x,
                cell.y,
                cell.direction,
                cell.level,
                cell.energy,
                cell.energy_old,
                cell.parent,
            ),
        )
    };
    let (code_offset, param_offset) = if n == 0 { (3usize, 4usize) } else { (5, 6) };
    let code = world.genomes.get(genome_index, gene_base + code_offset);
    let param = world.genomes.get(genome_index, gene_base + param_offset);

    if code > MAX_CONDITION_CODE {
        return 0;
    }

    let ctx = Ctx {
        x: ctx_base.0,
        y: ctx_base.1,
        dir: ctx_base.2,
        level: ctx_base.3,
        energy: ctx_base.4,
        energy_old: ctx_base.5,
        parent: ctx_base.6,
        param: param as i32,
    };

    if eval_condition(world, code, &ctx) {
        1
    } else {
        -1
    }
}
