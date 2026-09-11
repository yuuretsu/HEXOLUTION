const DEFAULT_RPC_TIMEOUT_MS = 15_000;

type PendingCall = {
  resolve: (v: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

export class WorkerClient<
  Methods extends Record<string, unknown[]>,
  Results extends { [Method in keyof Methods]: unknown },
  Events extends Record<string, unknown> = Record<string, unknown>
> {
  private seq = 0;
  private readonly pending = new Map<number, PendingCall>();
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
      const currentHandlers = this.eventHandlers.get(event);
      if (!currentHandlers) return;
      const index = currentHandlers.indexOf(handler);
      if (index === -1) return;
      currentHandlers.splice(index, 1);
      if (currentHandlers.length === 0) this.eventHandlers.delete(event);
    }
  }

  listen() {
    this.worker.onmessage = (e) => {
      const { id, result, error, event, data } = e.data;

      if (id !== undefined) {
        const pending = this.pending.get(id);
        if (!pending) return;
        this.pending.delete(id);
        clearTimeout(pending.timer);
        if (error !== undefined) pending.reject(toError(error));
        else pending.resolve(result);
      } else if (event) {
        const handlers = this.eventHandlers.get(event);
        handlers?.forEach((h) => h(data));
      }
    };

    this.worker.onerror = (e) => {
      this.rejectAll(e.message || "Worker error");
    };

    this.worker.onmessageerror = () => {
      this.rejectAll("Worker message could not be deserialized");
    };
  }

  call<Method extends keyof Methods>(
    method: Method,
    params: Methods[Method],
    transfer: Transferable[] = [],
    timeoutMs = DEFAULT_RPC_TIMEOUT_MS
  ): Promise<Results[Method]> {
    const id = this.seq++;
    const promise = new Promise<Results[Method]>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Worker RPC "${String(method)}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      });

      try {
        this.worker.postMessage({ id, method, params }, transfer);
      } catch (error) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(toError(error));
      }
    });

    promise.catch((error) => {
      console.error("[worker-rpc]", error);
    });

    return promise;
  }

  private rejectAll(message: string) {
    const error = new Error(message);
    for (const [id, pending] of this.pending) {
      this.pending.delete(id);
      clearTimeout(pending.timer);
      pending.reject(error);
    }
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

      try {
        const result = handlers[method as keyof Methods](
          ...(params as Methods[keyof Methods])
        );
        Promise.resolve(result).then(
          (v) => this.worker.postMessage({ id, result: v }),
          (error) => this.worker.postMessage({ id, error: String(error) })
        );
      } catch (error) {
        this.worker.postMessage({ id, error: String(error) });
      }
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
