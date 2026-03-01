export class Counter<T> {
  private counts = new Map<T, number>();

  constructor(items: T[] = []) {
    for (const item of items) {
      this.add(item);
    }
  }

  add(item: T) {
    this.counts.set(item, (this.counts.get(item) ?? 0) + 1);
  }

  getCount(item: T): number {
    return this.counts.get(item) ?? 0;
  }

  getMostCommon(n?: number): [T, number][] {
    const entries = [...this.counts.entries()];

    entries.sort((a, b) => b[1] - a[1]);

    return n !== undefined ? entries.slice(0, n) : entries;
  }
}