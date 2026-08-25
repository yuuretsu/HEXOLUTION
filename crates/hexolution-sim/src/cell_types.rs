//! Cell types, colors and Russian display names (port of `clans/cell-types.ts`).

/// RGBA channels held as JS-style numbers (unclamped until packing).
pub type Rgba = [f32; 4];

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug)]
#[repr(u8)]
pub enum CellType {
    Apex = 0,
    Leaf = 1,
    Antenna = 2,
    Root = 3,
    Wood = 4,
    Seed = 5,
}

pub const CELL_TYPE_COUNT: usize = 6;

/// Standard view colors (CLANS3 `cellColor`).
pub const CELL_COLORS: [Rgba; CELL_TYPE_COUNT] = [
    [255.0, 253.0, 183.0, 255.0], // Apex
    [0.0, 255.0, 0.0, 255.0],     // Leaf
    [0.0, 0.0, 255.0, 255.0],     // Antenna
    [255.0, 0.0, 0.0, 255.0],     // Root
    [60.0, 60.0, 60.0, 255.0],    // Wood
    [234.0, 232.0, 182.0, 255.0], // Seed
];

pub const CELL_TYPE_NAMES: [&str; CELL_TYPE_COUNT] = [
    "отросток",
    "лист",
    "антена",
    "корень",
    "древесина",
    "семечко",
];

pub const POISON_ORGANIC_COLOR: Rgba = [255.0, 224.0, 201.0, 255.0];
pub const POISON_ENERGY_COLOR: Rgba = [204.0, 204.0, 255.0, 255.0];

impl CellType {
    #[inline]
    pub fn as_index(self) -> usize {
        self as usize
    }

    #[inline]
    pub fn as_u8(self) -> u8 {
        self as u8
    }

    #[inline]
    pub fn color(self) -> Rgba {
        CELL_COLORS[self.as_index()]
    }

    #[inline]
    pub fn name(self) -> &'static str {
        CELL_TYPE_NAMES[self.as_index()]
    }
}
