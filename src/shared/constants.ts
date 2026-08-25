/** Hex cell height-to-width aspect ratio (rendering + world gen). */
export const HEX_ASPECT = 0.866;

/** World width in cells. */
export const WORLD_WIDTH = 512;

/** World height in cells (even, derived from HEX_ASPECT). */
export const WORLD_HEIGHT = Math.round(WORLD_WIDTH / HEX_ASPECT / 2) * 2;

/** Number of stone blobs placed during world generation. */
export const STONE_BLOB_COUNT = 0;

/** Payload passed once into WASM at startup (hot path reads a Rust copy). */
export const SIM_CONFIG = {
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  hexAspect: HEX_ASPECT,
  stoneBlobCount: STONE_BLOB_COUNT,
} as const;

export type SimConfig = {
  -readonly [K in keyof typeof SIM_CONFIG]: (typeof SIM_CONFIG)[K];
};
