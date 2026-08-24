import type { IGrid } from "./types";

const DX_ODD = [1, 1, 0, -1, 0, 1] as const;
const DX_EVEN = [1, 0, -1, -1, -1, 0] as const;
const DY = [0, 1, 1, 0, -1, -1] as const;
const defaultCoords: [number, number] = [0, 0];

export class GridMatrix<T> implements IGrid<T> {
  private readonly cells: (T | undefined)[][];
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () => new Array<T | undefined>(width));
  }

  private mapX(x: number): number {
    x %= this.width;
    return x < 0 ? x + this.width : x;
  }

  private mapY(y: number): number {
    y %= this.height;
    return y < 0 ? y + this.height : y;
  }

  get(x: number, y: number): T | undefined {
    return this.cells[this.mapY(y)][this.mapX(x)];
  }

  set(x: number, y: number, value: T | undefined): void {
    this.cells[this.mapY(y)][this.mapX(x)] = value;
  }

  *keys(): Generator<[number, number]> {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x] !== undefined) yield [x, y];
      }
    }
  }

  *entries(): Generator<[number, number, T]> {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const val = this.cells[y][x];
        if (val !== undefined) yield [x, y, val];
      }
    }
  }

  swap(ax: number, ay: number, bx: number, by: number): void {
    const ay0 = this.mapY(ay);
    const ax0 = this.mapX(ax);
    const by0 = this.mapY(by);
    const bx0 = this.mapX(bx);
    const tmp = this.cells[ay0][ax0];
    this.cells[ay0][ax0] = this.cells[by0][bx0];
    this.cells[by0][bx0] = tmp;
  }

  getCoordsByNarrow(
    x: number,
    y: number,
    narrow: number,
    distance: number = 1,
    out: [number, number] = defaultCoords,
  ): [number, number] {
    let curX = x;
    let curY = y;
    const n = ((narrow % 6) + 6) % 6;
    for (let i = 0; i < distance; i++) {
      const isOdd = curY % 2 !== 0;
      const dx = isOdd ? DX_ODD[n] : DX_EVEN[n];
      const dy = DY[n];
      curX = this.mapX(curX + dx);
      curY = this.mapY(curY + dy);
    }
    out[0] = curX;
    out[1] = curY;
    return out;
  }
}
