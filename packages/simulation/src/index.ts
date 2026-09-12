export {
  MAX_CELL_ENERGY,
  ENERGY_PER_CELL,
  GENOME_LENGTH,
  GENES_PER_TICK,
  GENOME_MUTATION_RATE,
  COLORATION_MUTATION_RATE,
  AGE_ENERGY_COST_FACTOR,
} from "./constants";
export { geneIdFromBases } from "./gene-id";
export {
  createWorld,
  WorldItemStatic,
  WorldItemDynamic,
  sendEnergy,
  type World,
  type WorldItem,
} from "./world";
export { Creature } from "./creature";
export { Organic } from "./organic";
export { Stone } from "./stone";
export { Tape, getRandomBase4, type Base4 } from "./tape";
export { Dichotomy } from "./dichotomy";
export { GridPublisher } from "./api/grid-publisher";
export { getGeneMeta } from "./api/gene-meta";
export {
  CellKind,
  GRID_CELL_STRIDE,
  GRID_LAYOUT_VERSION,
  LAST_GENE_NONE,
  readCell,
  writeCell,
  clearCell,
} from "./api/grid-layout";
export type {
  GeneMeta,
  GridBufferMeta,
  Rgb,
  CellSnapshot,
} from "./api/types";
