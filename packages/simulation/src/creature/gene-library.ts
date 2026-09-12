import { lerp, lerpRgb } from "@hexolution/shared";
import type { Rgba } from "@hexolution/shared";
import type { WorldItem } from "../world";
import { Creature } from "./creature";
import { Organic } from "../organic";
import { Stone } from "../stone";
import { GENE_CONTINUE, GENE_FINISHED, type GeneHandler } from "./gene-types";
import {
  ATTACK_ENERGY_COST,
  ATTACK_MAX_STRENGTH,
  COLOR_ATTACK,
  COLOR_MOVE_FORWARD,
  COLOR_PHOTOSYNTHESIS,
  COLOR_PUSH,
  FRIEND_COLORATION_THRESHOLD,
  MOVE_ENERGY_COST,
  PHOTOSYNTHESIS_ABUNDANCE_RATIO,
  PHOTOSYNTHESIS_ENERGY_COST,
  PHOTOSYNTHESIS_MAX_YIELD,
  PUSH_ENERGY_COST,
  REPRODUCE_ENERGY_COST,
  REPRODUCE_MIN_ENERGY,
  SPECIALIZATION_LEARN_RATE,
} from "./constants";

type ScanCategory = "empty" | "friend" | "enemy" | "organic" | "stone";

const scanJumps = {
  empty: 0,
  friend: 0,
  enemy: 0,
  organic: 0,
  stone: 0,
};

const lookCoords: [number, number] = [0, 0];
const pushFwd: [number, number] = [0, 0];
const pushBwd: [number, number] = [0, 0];

const colorationDiff = (a: Rgba, b: Rgba): number => {
  const dr = Math.abs(a[0] - b[0]);
  const dg = Math.abs(a[1] - b[1]);
  const db = Math.abs(a[2] - b[2]);
  return (dr + dg + db) / (3 * 255);
};

const classifyTarget = (target: WorldItem | null | undefined, creature: Creature): ScanCategory => {
  if (!target) return "empty";
  if (target instanceof Creature) {
    return colorationDiff(creature.coloration, target.coloration) > FRIEND_COLORATION_THRESHOLD ? "enemy" : "friend";
  }
  if (target instanceof Organic) return "organic";
  if (target instanceof Stone) return "stone";
  return "stone";
};

export const moveForward: GeneHandler = (ctx) => {
  const { creature } = ctx;
  lerpRgb(creature.color, COLOR_MOVE_FORWARD, 0.01);
  ctx.pay(MOVE_ENERGY_COST);
  const [nx, ny] = ctx.cellCoords(creature.direction, 1, lookCoords);
  if (ctx.getAt(nx, ny)) return GENE_FINISHED;
  ctx.swapHere(nx, ny);
  return GENE_FINISHED;
};

export const rotateRight: GeneHandler = (ctx) => {
  ctx.creature.direction += 1;
  return GENE_CONTINUE;
};

export const reproduce: GeneHandler = (ctx) => {
  const { creature } = ctx;
  const amount = creature.tape.readFloat();
  ctx.pay(REPRODUCE_ENERGY_COST);
  if (creature.energy < REPRODUCE_MIN_ENERGY) return GENE_FINISHED;
  const [nx, ny] = ctx.cellCoords(creature.direction, 1, lookCoords);
  if (ctx.getAt(nx, ny)) return GENE_FINISHED;
  const child = creature.reproduce();
  ctx.give(child, Math.round(creature.energy * amount));
  ctx.setAt(nx, ny, child);
  return GENE_FINISHED;
};

export const absorbLight: GeneHandler = (ctx) => {
  const { creature } = ctx;
  lerpRgb(creature.color, COLOR_PHOTOSYNTHESIS, 0.01);
  ctx.pay(PHOTOSYNTHESIS_ENERGY_COST);
  const abundance = ctx.ambientAbundance(PHOTOSYNTHESIS_ABUNDANCE_RATIO);
  const e = Math.round(PHOTOSYNTHESIS_MAX_YIELD * abundance * creature.autotrophOrHeterotroph.left ** 2);
  creature.autotrophOrHeterotroph.left = lerp(creature.autotrophOrHeterotroph.left, 1, SPECIALIZATION_LEARN_RATE);
  ctx.absorb(e);
  return GENE_FINISHED;
};

export const attackForward: GeneHandler = (ctx) => {
  const { creature } = ctx;
  lerpRgb(creature.color, COLOR_ATTACK, 0.02);
  ctx.pay(ATTACK_ENERGY_COST);
  const [nx, ny] = ctx.cellCoords(creature.direction, 1, lookCoords);
  const target = ctx.getAt(nx, ny);
  if (!target) return GENE_FINISHED;
  const strength = Math.round(ATTACK_MAX_STRENGTH * creature.autotrophOrHeterotroph.right ** 2);
  creature.autotrophOrHeterotroph.right = lerp(creature.autotrophOrHeterotroph.right, 1, SPECIALIZATION_LEARN_RATE);
  const stolen = target.handleAttack(ctx.energyPool, strength);
  ctx.take(stolen, stolen.energy);
  return GENE_FINISHED;
};

export const checkSelfEnergy: GeneHandler = (ctx) => {
  const { creature } = ctx;
  const treshold = creature.tape.readFloat();
  const jumpA = creature.tape.readInt();
  const jumpB = creature.tape.readInt();
  if (creature.energy * 100 < treshold) {
    creature.tape.jump(jumpA);
    return GENE_CONTINUE;
  }
  creature.tape.jump(jumpB);
  return GENE_CONTINUE;
};

export const scanForward: GeneHandler = (ctx) => {
  const { creature } = ctx;
  const distance = Math.floor(creature.tape.readFloat() * 10) + 1;
  scanJumps.empty = creature.tape.readInt();
  scanJumps.friend = creature.tape.readInt();
  scanJumps.enemy = creature.tape.readInt();
  scanJumps.organic = creature.tape.readInt();
  scanJumps.stone = creature.tape.readInt();

  let target: WorldItem | undefined;
  for (let d = 1; d <= distance; d++) {
    const [nx, ny] = ctx.cellCoords(creature.direction, d, lookCoords);
    target = ctx.getAt(nx, ny);
    if (target) break;
  }
  creature.tape.jump(scanJumps[classifyTarget(target, creature)]);
  return GENE_CONTINUE;
};

export const inspectForward: GeneHandler = (ctx) => {
  const { creature } = ctx;
  scanJumps.empty = creature.tape.readInt();
  scanJumps.friend = creature.tape.readInt();
  scanJumps.enemy = creature.tape.readInt();
  scanJumps.organic = creature.tape.readInt();
  scanJumps.stone = creature.tape.readInt();

  const [nx, ny] = ctx.cellCoords(creature.direction, 1, lookCoords);
  creature.tape.jump(scanJumps[classifyTarget(ctx.getAt(nx, ny), creature)]);
  return GENE_CONTINUE;
};

export const resetGenomePointer: GeneHandler = (ctx) => {
  ctx.creature.tape.pointer = 0;
  return GENE_FINISHED;
};

export const displaceForward: GeneHandler = (ctx) => {
  const { creature } = ctx;
  lerpRgb(creature.color, COLOR_PUSH, 0.01);
  ctx.pay(PUSH_ENERGY_COST);
  const [fx, fy] = ctx.cellCoords(creature.direction, 1, pushFwd);
  if (!ctx.getAt(fx, fy)) return GENE_FINISHED;
  const [bx, by] = ctx.cellCoords((creature.direction + 3) % 6, 1, pushBwd);
  if (ctx.getAt(bx, by)) return GENE_FINISHED;
  ctx.swapCells(fx, fy, bx, by);
  return GENE_FINISHED;
};

/** Stable handler order — matches historical `Object.values` enumeration order. */
export const GENE_HANDLERS: readonly GeneHandler[] = [
  moveForward,
  rotateRight,
  reproduce,
  absorbLight,
  attackForward,
  checkSelfEnergy,
  scanForward,
  inspectForward,
  resetGenomePointer,
  displaceForward,
];
