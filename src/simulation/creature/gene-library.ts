import { lerp, lerpRgb } from "@/shared/utils";
import type { Rgba } from "@/shared/types";
import { sendEnergy, World } from "@/simulation/world";
import type { WorldItem } from "@/simulation/world";
import { Creature } from "./creature";
import { Food } from "@/simulation/food";
import { Stone } from "@/simulation/stone";
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
import { scanRay } from "./utils";

type ScanCategory = "empty" | "friend" | "enemy" | "food" | "stone";

const coordsA: [number, number] = [0, 0];
const coordsB: [number, number] = [0, 0];
const scanJumps = {
  empty: 0,
  friend: 0,
  enemy: 0,
  food: 0,
  stone: 0,
};

const colorationDiff = (a: Rgba, b: Rgba): number => {
  const dr = Math.abs(a[0] - b[0]);
  const dg = Math.abs(a[1] - b[1]);
  const db = Math.abs(a[2] - b[2]);
  return (dr + dg + db) / (3 * 255);
};

const classifyTarget = (target: WorldItem | null, creature: Creature): ScanCategory => {
  if (!target) return "empty";
  if (target instanceof Creature) {
    return colorationDiff(creature.coloration, target.coloration) > FRIEND_COLORATION_THRESHOLD ? "enemy" : "friend";
  }
  if (target instanceof Food) return "food";
  if (target instanceof Stone) return "stone";
  return "stone";
};

export const moveForward: GeneHandler = (creature, world, x, y) => {
  lerpRgb(creature.color, COLOR_MOVE_FORWARD, 0.01);
  sendEnergy(creature, world, MOVE_ENERGY_COST);
  world.grid.getCoordsByNarrow(x, y, creature.direction, 1, coordsA);
  if (world.grid.get(coordsA[0], coordsA[1])) return GENE_FINISHED;
  world.grid.swap(x, y, coordsA[0], coordsA[1]);
  return GENE_FINISHED;
};

export const rotateRight: GeneHandler = (creature, _grid, _x, _y) => {
  creature.direction += 1;
  return GENE_CONTINUE;
};

export const reproduce: GeneHandler = (creature, world, x, y) => {
  const amount = creature.tape.readFloat();
  sendEnergy(creature, world, REPRODUCE_ENERGY_COST);
  if (creature.energy < REPRODUCE_MIN_ENERGY) return GENE_FINISHED;
  world.grid.getCoordsByNarrow(x, y, creature.direction, 1, coordsA);
  if (world.grid.get(coordsA[0], coordsA[1])) return GENE_FINISHED;
  const child = creature.reproduce();
  sendEnergy(creature, child, Math.round(creature.energy * amount));
  world.grid.set(coordsA[0], coordsA[1], child);
  return GENE_FINISHED;
};

export const absorbLight: GeneHandler = (creature, world, _x, _y) => {
  lerpRgb(creature.color, COLOR_PHOTOSYNTHESIS, 0.01);
  sendEnergy(creature, world, PHOTOSYNTHESIS_ENERGY_COST);
  const abundance = Math.min(1, world.energy / (world.totalEnergy * PHOTOSYNTHESIS_ABUNDANCE_RATIO)) ** 2;
  const e = Math.round(PHOTOSYNTHESIS_MAX_YIELD * abundance * creature.autotrophOrHeterotroph.left ** 2);
  creature.autotrophOrHeterotroph.left = lerp(creature.autotrophOrHeterotroph.left, 1, SPECIALIZATION_LEARN_RATE);
  sendEnergy(world, creature, e);
  return GENE_FINISHED;
};

export const attackForward: GeneHandler = (creature, world, x, y) => {
  lerpRgb(creature.color, COLOR_ATTACK, 0.02);
  sendEnergy(creature, world, ATTACK_ENERGY_COST);
  world.grid.getCoordsByNarrow(x, y, creature.direction, 1, coordsA);
  const target = world.grid.get(coordsA[0], coordsA[1]);
  if (!target) return GENE_FINISHED;
  const strength = Math.round(ATTACK_MAX_STRENGTH * creature.autotrophOrHeterotroph.right ** 2);
  creature.autotrophOrHeterotroph.right = lerp(creature.autotrophOrHeterotroph.right, 1, SPECIALIZATION_LEARN_RATE);
  const result = target.handleAttack(world, strength);
  sendEnergy(result, creature, result.energy);
  return GENE_FINISHED;
};

export const checkSelfEnergy: GeneHandler = (creature, _world, _x, _y) => {
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

export const scanForward: GeneHandler = (creature, world, x, y) => {
  const distance = Math.floor(creature.tape.readFloat() * 10) + 1;
  scanJumps.empty = creature.tape.readInt();
  scanJumps.friend = creature.tape.readInt();
  scanJumps.enemy = creature.tape.readInt();
  scanJumps.food = creature.tape.readInt();
  scanJumps.stone = creature.tape.readInt();

  const target = scanRay(creature, world, x, y, distance);
  const category = classifyTarget(target, creature);
  creature.tape.jump(scanJumps[category]);

  return GENE_CONTINUE;
};

export const inspectForward: GeneHandler = (creature, world, x, y) => {
  scanJumps.empty = creature.tape.readInt();
  scanJumps.friend = creature.tape.readInt();
  scanJumps.enemy = creature.tape.readInt();
  scanJumps.food = creature.tape.readInt();
  scanJumps.stone = creature.tape.readInt();

  const target = scanRay(creature, world, x, y, 1);
  const category = classifyTarget(target, creature);
  creature.tape.jump(scanJumps[category]);

  return GENE_CONTINUE;
};

export const resetGenomePointer: GeneHandler = (creature, _world, _x, _y) => {
  creature.tape.pointer = 0;
  return GENE_FINISHED;
};

export const displaceForward: GeneHandler = (creature, world, x, y) => {
  lerpRgb(creature.color, COLOR_PUSH, 0.01);
  sendEnergy(creature, world, PUSH_ENERGY_COST);
  world.grid.getCoordsByNarrow(x, y, creature.direction, 1, coordsA);
  const objFwd = world.grid.get(coordsA[0], coordsA[1]);
  if (!objFwd) return GENE_FINISHED;
  world.grid.getCoordsByNarrow(x, y, (creature.direction + 3) % 6, 1, coordsB);
  const objBwd = world.grid.get(coordsB[0], coordsB[1]);
  if (objBwd) return GENE_FINISHED;
  world.grid.swap(coordsA[0], coordsA[1], coordsB[0], coordsB[1]);
  return GENE_FINISHED;
};
