import type { Rgba } from "types";
import { WorldItemStatic } from "world";

export class Stone extends WorldItemStatic {
  readonly CLASS_NAME = "Stone";

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