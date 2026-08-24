import { EntityKind } from "@/simulation/entity-kind";
import type { WorldItem } from "@/simulation/world";
import type { IGrid } from "@/shared/utils/grid";

export class SelectionManager {
  selectedId = 0;
  selectedItem: WorldItem | null = null;

  select(grid: IGrid<WorldItem>, ...params: [number, number] | []) {
    if (!params.length) {
      this.selectedId = 0;
      this.selectedItem = null;
      return;
    }
    const item = grid.get(Math.floor(params[0]), Math.floor(params[1])) ?? null;
    this.selectedId = item?.id ?? 0;
    this.selectedItem = item;
  }

  syncFromRender(selectedItem: WorldItem | null) {
    if (!selectedItem) this.selectedId = 0;
    this.selectedItem = selectedItem;
  }
}

export const isCreature = (item: WorldItem): item is WorldItem & { kind: typeof EntityKind.Creature } =>
  item.kind === EntityKind.Creature;
