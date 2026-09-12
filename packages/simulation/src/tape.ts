import { choice } from "@hexolution/shared";
import { geneIdFromBases } from "./gene-id";

export type Base4 = 0 | 1 | 2 | 3;

const base4Options = [0, 1, 2, 3] as const;

export const getRandomBase4 = () => choice(base4Options)

export class Tape {
  data: Uint8Array;
  pointer: number = 0;

  static random(length: number): Tape {
    return new Tape(Uint8Array.from({ length }, () => getRandomBase4()));
  }

  constructor(data: Uint8Array) {
    if (!data.length) throw new Error("Данные ленты не могут быть пустыми.");
    this.data = data;
  }

  private read(): Base4 {
    const value = this.data[this.pointer];
    this.pointer = (this.pointer + 1) % this.data.length;
    // Hot path: genome reads skip a runtime range check.
    // eslint-disable-next-line no-restricted-syntax -- performance-critical tape reads
    return value as Base4;
  }

  jump(n: number): void {
    this.pointer = (this.pointer + n * 3) % this.data.length;
  }

  readInt(): number {
    const a = this.read();
    const b = this.read();
    const c = this.read();
    return geneIdFromBases(a, b, c);
  }

  readFloat(): number {
    return this.readInt() / 64;
  }
}
