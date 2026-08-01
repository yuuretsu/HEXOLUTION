import type { IGrid } from "./types";

export class GridMap<T> implements IGrid<T> {
  private readonly cells: Map<number, T> = new Map();
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private mapX(x: number): number {
    x %= this.width;
    return x < 0 ? x + this.width : x;
  }

  private mapY(y: number): number {
    y %= this.height;
    return y < 0 ? y + this.height : y;
  }

  private getIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  private getCoords(index: number): [number, number] {
    const x = index % this.width;
    const y = (index - x) / this.width;
    return [x, y];
  }

  get(x: number, y: number): T | undefined {
    return this.cells.get(this.getIndex(this.mapX(x), this.mapY(y)));
  }

  set(x: number, y: number, value: T | undefined): void {
    const index = this.getIndex(this.mapX(x), this.mapY(y));
    if (value === undefined) {
      this.cells.delete(index);
    } else {
      this.cells.set(index, value);
    }
  }

  *keys(): Generator<[number, number]> {
    for (const index of this.cells.keys()) {
      yield this.getCoords(index);
    }
  }

  *entries(): Generator<[number, number, T]> {
    for (const [index, value] of this.cells.entries()) {
      const [x, y] = this.getCoords(index);
      yield [x, y, value];
    }
  }

  swap(ax: number, ay: number, bx: number, by: number): void {
    const idxA = this.getIndex(this.mapX(ax), this.mapY(ay));
    const idxB = this.getIndex(this.mapX(bx), this.mapY(by));
    const valA = this.cells.get(idxA);
    const valB = this.cells.get(idxB);

    if (valB === undefined) this.cells.delete(idxA);
    else this.cells.set(idxA, valB);

    if (valA === undefined) this.cells.delete(idxB);
    else this.cells.set(idxB, valA);
  }

  getCoordsByNarrow(x: number, y: number, narrow: number, distance: number = 1): [number, number] {
    let curX = x;
    let curY = y;
    const n = ((narrow % 6) + 6) % 6;
    for (let i = 0; i < distance; i++) {
      const isOdd = curY % 2 !== 0;
      const dx = isOdd ? [1, 1, 0, -1, 0, 1][n] : [1, 0, -1, -1, -1, 0][n];
      const dy = [0, 1, 1, 0, -1, -1][n];
      curX = this.mapX(curX + dx);
      curY = this.mapY(curY + dy);
    }
    return [curX, curY];
  }
}