//! Push/pull soil one step in a relative direction (port of `clans/soil-actions.ts`).

use crate::directions::abs_dir;
use crate::sensors::coords_at_abs;
use crate::world::World;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum SoilKind {
    Organic,
    Energy,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum SoilMode {
    Push,
    Pull,
}

pub fn move_soil_rel(
    world: &mut World,
    x: i32,
    y: i32,
    direction: i32,
    where_: i32,
    kind: SoilKind,
    mode: SoilMode,
) -> bool {
    let dir = abs_dir(direction, where_);
    let (nx, ny) = coords_at_abs(world, x, y, dir, 1);

    if kind == SoilKind::Organic {
        if mode == SoilMode::Push {
            let here = world.soil.get_organic(x, y);
            world.soil.add_organic(nx, ny, here);
            world.soil.set_organic(x, y, 0);
            return true;
        }
        let value = world.soil.get_organic(nx, ny);
        if value <= 0 {
            world.soil.add_organic(x, y, value);
            world.soil.set_organic(nx, ny, 0);
            return false;
        }
        world.soil.add_organic(x, y, value);
        world.soil.set_organic(nx, ny, 0);
        return true;
    }

    if mode == SoilMode::Push {
        let here = world.soil.get_energy(x, y);
        world.soil.add_energy(nx, ny, here);
        world.soil.set_energy(x, y, 0.0);
        return true;
    }
    let value = world.soil.get_energy(nx, ny);
    if value <= 0.0 {
        world.soil.add_energy(x, y, value);
        world.soil.set_energy(nx, ny, 0.0);
        return false;
    }
    world.soil.add_energy(x, y, value);
    world.soil.set_energy(nx, ny, 0.0);
    true
}
