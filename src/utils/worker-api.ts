export class WorkerClient<
  Methods extends Record<string, unknown[]>,
  Results extends { [Method in keyof Methods]: unknown },
  Events extends Record<string, unknown> = Record<string, unknown>
> {
  private seq = 0;
  private readonly pending = new Map<number, (v: unknown) => void>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly eventHandlers = new Map<keyof Events, ((data: any) => void)[]>();
  private readonly worker: Worker;

  constructor(worker: Worker) {
    this.worker = worker;
  }

  on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    const handlers = this.eventHandlers.get(event) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);

    return () => {
      this.eventHandlers.delete(event);
    }
  }

  listen() {
    this.worker.onmessage = (e) => {
      const { id, result, event, data } = e.data;

      if (id !== undefined) {
        const resolve = this.pending.get(id);
        if (resolve) {
          this.pending.delete(id);
          resolve(result);
        }
      } else if (event) {
        const handlers = this.eventHandlers.get(event);
        handlers?.forEach((h) => h(data));
      }
    };
  }

  call<Method extends keyof Methods>(
    method: Method,
    params: Methods[Method],
    transfer: Transferable[] = []
  ): Promise<Results[Method]> {
    const id = this.seq++;
    return new Promise((res) => {
      this.pending.set(id, res as (v: unknown) => void);
      this.worker.postMessage({ id, method, params }, transfer);
    });
  }
}

export class WorkerServer<
  Methods extends Record<string, unknown[]>,
  Results extends { [Method in keyof Methods]: unknown },
  Events extends Record<string, unknown> = Record<string, unknown>
> {
  worker: Window & typeof globalThis;

  constructor(
    worker: Window & typeof globalThis,
    handlers: {
      [Method in keyof Methods]: (...params: Methods[Method]) => Results[Method];
    }
  ) {
    this.worker = worker;
    worker.addEventListener("message", (e) => {
      const { id, method, params } = e.data;
      if (id === undefined) return;

      const result = handlers[method as keyof Methods](
        ...(params as Methods[keyof Methods])
      );
      Promise.resolve(result).then((v) =>
        this.worker.postMessage({ id, result: v })
      );
    });
  }

  emit<K extends keyof Events>(
    event: K,
    data: Events[K],
    transfer: Transferable[] = []
  ) {
    this.worker.postMessage({ event, data }, { transfer });
  }
}