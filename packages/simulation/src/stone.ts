import type { Rgba } from "@hexolution/shared";
import { WorldItemStatic } from "./world";

export class Stone extends WorldItemStatic {
  override get CLASS_NAME() {
    return "Stone";
  }

  color: Rgba;

  constructor() {
    super();
    const offset = Math.floor(Math.random() ** 3 * 20);
    const br = Math.random() < 0.5 ? 50 + offset : Math.max(25, 50 - offset);
    this.color = [br, br, br, 255];
  }

  getColor(): Rgba {
    return this.color;
  }

  getEnergyColor(): Rgba {
    return this.color;
  }

  getGenomeHashColor(): Rgba {
    return this.color;
  }

  getColoration(): Rgba {
    return this.color;
  }

  getLastActionColor(): Rgba {
    return this.color;
  }
}
