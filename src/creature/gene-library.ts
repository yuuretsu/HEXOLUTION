import { lerp, lerpRgb } from "utils";
import { sendEnergy, World } from "world";
import { Creature } from "./creature";
import type { GeneHandler } from "./gene-types";
import { COLOR_ATTACK, COLOR_MOVE_FORWARD, COLOR_PHOTOSYNTHESIS, COLOR_PUSH } from "./constants";
import { scanRay } from "./utils";

export const moveForward: GeneHandler = (creature, world, x, y) => {
  lerpRgb(creature.color, COLOR_MOVE_FORWARD, 0.01);
  sendEnergy(creature, world, 5);
  const coordsFwd = world.grid.getCoordsByNarrow(x, y, creature.direction);
  if (world.grid.get(...coordsFwd)) return { isFinished: true };
  world.grid.swap(x, y, ...coordsFwd)
  return { isFinished: true };
}

export const rotateRight: GeneHandler = (creature, _grid, _x, _y) => {
  creature.direction += 1;
  return { isFinished: false };
}

export const reproduce: GeneHandler = (creature, world, x, y) => {
  const amount = creature.tape.readFloat();
  sendEnergy(creature, world, 10);
  if (creature.energy < 100) return { isFinished: true };
  const coordsFwd = world.grid.getCoordsByNarrow(x, y, creature.direction);
  if (world.grid.get(...coordsFwd)) return { isFinished: true };
  const child = creature.reproduce();
  sendEnergy(creature, child, Math.round(creature.energy * amount));
  world.grid.set(...coordsFwd, child);
  return { isFinished: true };
};

export const absorbLight: GeneHandler = (creature, world, _x, _y) => {
  lerpRgb(creature.color, COLOR_PHOTOSYNTHESIS, 0.01);
  sendEnergy(creature, world, 2)
  const max = world.grid.width * world.grid.height * 0.01;
  const e = Math.round(Math.min(50, world.energy / max * 1) * creature.autotrophOrHeterotroph.left ** 2);
  creature.autotrophOrHeterotroph.left = lerp(creature.autotrophOrHeterotroph.left, 1, 0.0001);
  sendEnergy(world, creature, e)
  return { isFinished: true };
}

export const attackForward: GeneHandler = (creature, world, x, y) => {
  lerpRgb(creature.color, COLOR_ATTACK, 0.02);
  sendEnergy(creature, world, 10);
  const coordsFwd = world.grid.getCoordsByNarrow(x, y, creature.direction);
  const target = world.grid.get(...coordsFwd);
  if (!target) return { isFinished: true };
  const strength = Math.round(200 * creature.autotrophOrHeterotroph.right ** 2);
  creature.autotrophOrHeterotroph.right = lerp(creature.autotrophOrHeterotroph.right, 1, 0.0001);
  const result = target.handleAttack(world, strength);
  sendEnergy(result, creature, result.energy);
  return { isFinished: true };
}

export const checkSelfEnergy: GeneHandler = (creature, _world, _x, _y) => {
  const treshold = creature.tape.readFloat();
  const jumpA = creature.tape.readInt();
  const jumpB = creature.tape.readInt();
  if (creature.energy * 100 < treshold) {
    creature.tape.jump(jumpA);
    return { isFinished: false };
  }
  creature.tape.jump(jumpB);
  return { isFinished: false };
}

export const scanForward: GeneHandler = (creature, world, x, y) => {
  const distance = Math.floor(creature.tape.readFloat() * 10) + 1;
  const jumpIfEmpty = creature.tape.readInt();
  const jumpIfFriend = creature.tape.readInt();
  const jumpIfEnemy = creature.tape.readInt();
  const jumpIfOther = creature.tape.readInt();

  const target = scanRay(creature, world, x, y, distance);

  if (!target) {
    creature.tape.jump(jumpIfEmpty);
  } else if (target instanceof Creature) {
    let diff = 0;
    const maxLen = Math.max(creature.tape.data.length, target.tape.data.length);
    for (let i = 0; i < maxLen; i++) {
      if (creature.tape.data[i] !== target.tape.data[i]) diff++;
    }
    if (diff / maxLen > 0.1) creature.tape.jump(jumpIfEnemy);
    else creature.tape.jump(jumpIfFriend);
  } else {
    creature.tape.jump(jumpIfOther);
  }

  return { isFinished: false };
};

export const inspectForward: GeneHandler = (creature, world, x, y) => {
  const jumpIfEmpty = creature.tape.readInt();
  const jumpIfFriend = creature.tape.readInt();
  const jumpIfEnemy = creature.tape.readInt();
  const jumpIfOther = creature.tape.readInt();

  const target = scanRay(creature, world, x, y, 1);

  if (!target) {
    creature.tape.jump(jumpIfEmpty);
  } else if (target instanceof Creature) {
    let diff = 0;
    const maxLen = Math.max(creature.tape.data.length, target.tape.data.length);
    for (let i = 0; i < maxLen; i++) {
      if (creature.tape.data[i] !== target.tape.data[i]) diff++;
    }
    if (diff / maxLen > 0.1) creature.tape.jump(jumpIfEnemy);
    else creature.tape.jump(jumpIfFriend);
  } else {
    creature.tape.jump(jumpIfOther);
  }

  return { isFinished: false };
};

export const resetGenomePointer: GeneHandler = (creature, _world, _x, _y) => {
  creature.tape.pointer = 0;
  return { isFinished: true };
}

export const displaceForward: GeneHandler = (creature, world, x, y) => {
  lerpRgb(creature.color, COLOR_PUSH, 0.01);
  sendEnergy(creature, world, 10);
  const coordsFwd = world.grid.getCoordsByNarrow(x, y, creature.direction);
  const objFwd = world.grid.get(...coordsFwd);
  if (!objFwd) return { isFinished: true };
  const coordsBwd = world.grid.getCoordsByNarrow(x, y, (creature.direction + 3) % 6);
  const objBwd = world.grid.get(...coordsBwd);
  if (objBwd) return { isFinished: true };
  world.grid.swap(...coordsFwd, ...coordsBwd);
  return { isFinished: true };
}
