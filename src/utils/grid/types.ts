export interface IGrid<T> {
  readonly width: number;
  readonly height: number;
  get(x: number, y: number): T | undefined;
  set(x: number, y: number, value: T | undefined): void;
  swap(ax: number, ay: number, bx: number, by: number): void;
  keys(): Generator<[number, number]>;
  entries(): Generator<[number, number, T]>;
  getCoordsByNarrow(x: number, y: number, narrow: number, distance?: number): [number, number];
}