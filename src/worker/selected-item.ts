import { EntityKind } from "@/simulation/entity-kind";
import { Creature } from "@/simulation/creature";
import type { WorldItem } from "@/simulation/world";

export const serializeSelectedItem = (item: WorldItem | null) => {
  if (!item) return null;

  const commonData = { type: item.kind, color: item.getColor() };
  if (item instanceof Creature) {
    return {
      ...commonData,
      direction: item.direction,
      program: [...item.tape.data],
      pointer: item.tape.pointer,
      age: item.age,
      energy: item.energy,
      coloration: item.getColoration(),
    };
  }
  return commonData;
};

export const isCreatureItem = (item: { type: string }) => item.type === EntityKind.Creature;
