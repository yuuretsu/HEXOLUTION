import type { Rgba } from "@/shared/types";
import { EntityKind } from "@/simulation/entity-kind";
import { WorldItemStatic } from "@/simulation/world";

export class Stone extends WorldItemStatic {
  readonly kind = EntityKind.Stone;

  color: Rgba;

  constructor() {
    super();
    const br = Math.floor(Math.random() ** 5 * 20 + 50);
    this.color = [br, br, br, 255];
  }

  getColor(): Rgba {
    return this.color
  }
}
