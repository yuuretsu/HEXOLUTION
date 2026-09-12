import type { SelectedItemData } from "@/shared/worker-protocol";
import {
  Creature,
  Organic,
  Stone,
  type WorldItem,
} from "@hexolution/simulation";

export const serializeSelectedItem = (item: WorldItem | null): SelectedItemData | null => {
  if (!item) return null;

  if (item instanceof Creature) {
    return {
      type: "Creature",
      color: item.getColor(),
      direction: item.direction,
      program: [...item.tape.data],
      pointer: item.tape.pointer,
      age: item.age,
      generation: item.generation,
      energy: item.energy,
      coloration: item.getColoration(),
      activeGeneIndices: [...item.activeGeneIndices],
    };
  }

  if (item instanceof Organic) {
    return { type: "Organic", color: item.getColor() };
  }

  if (item instanceof Stone) {
    return { type: "Stone", color: item.getColor() };
  }

  throw new Error(`Unknown world item: ${item.CLASS_NAME}`);
};
