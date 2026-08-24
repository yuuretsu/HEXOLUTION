/**
 * Simple reusable object pool.
 * Call `acquire()` to take an instance, `release(item)` when done.
 */
export class ObjectPool<T> {
  private readonly items: T[] = [];
  private readonly create: () => T;
  private readonly maxSize: number;

  constructor(create: () => T, maxSize = Infinity) {
    this.create = create;
    this.maxSize = maxSize;
  }

  /** Take an instance from the pool, or create one if empty. */
  acquire(): T {
    return this.items.pop() ?? this.create();
  }

  /** Return an instance to the pool for later reuse. */
  release(item: T): void {
    if (this.items.length >= this.maxSize) return;
    this.items.push(item);
  }

  get size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items.length = 0;
  }
}
