const trust = <T,>(_value: unknown): _value is T => true;

const TRANSFER_RESULT: unique symbol = Symbol("worker.transferResult");

export type TransferResult<T> = {
  readonly [TRANSFER_RESULT]: true;
  readonly result: T;
  readonly transfer: Transferable[];
};

export const withTransfer = <T>(
  result: T,
  transfer: Transferable[]
): TransferResult<T> => ({
  [TRANSFER_RESULT]: true,
  result,
  transfer,
});

const isTransferResult = (value: unknown): value is TransferResult<unknown> => {
  if (typeof value !== "object" || value === null || !(TRANSFER_RESULT in value)) {
    return false;
  }
  return value[TRANSFER_RESULT] === true;
};

export class WorkerClient<
  Methods extends Record<string, unknown[]>,
  Results extends { [Method in keyof Methods]: unknown },
  Events extends Record<string, unknown> = Record<string, unknown>
> {
  private seq = 0;
  private readonly pending = new Map<number, (v: unknown) => void>();
  private readonly eventHandlers = new Map<
    keyof Events,
    Set<(data: unknown) => void>
  >();
  private readonly worker: Worker;

  constructor(worker: Worker) {
    this.worker = worker;
  }

  on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    const wrapped = (data: unknown) => {
      if (trust<Events[K]>(data)) handler(data);
    };
    const handlers = this.eventHandlers.get(event) ?? new Set();
    handlers.add(wrapped);
    this.eventHandlers.set(event, handlers);

    return () => {
      const currentHandlers = this.eventHandlers.get(event);
      if (!currentHandlers) return;
      currentHandlers.delete(wrapped);
      if (currentHandlers.size === 0) this.eventHandlers.delete(event);
    };
  }

  private isListening = false;

  listen() {
    if (this.isListening) return;
    this.isListening = true;
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
    return new Promise((resolve) => {
      this.pending.set(id, (value) => {
        if (trust<Results[Method]>(value)) resolve(value);
      });
      this.worker.postMessage({ id, method, params }, transfer);
    });
  }
}

type ClientRequest<Methods extends Record<string, unknown[]>> = {
  [Method in keyof Methods]: {
    id: number;
    method: Method;
    params: Methods[Method];
  };
}[keyof Methods];

type HandlerReturn<T> = T | TransferResult<T> | Promise<T | TransferResult<T>>;

export class WorkerServer<
  Methods extends Record<string, unknown[]>,
  Results extends { [Method in keyof Methods]: unknown },
  Events extends Record<string, unknown> = Record<string, unknown>
> {
  private readonly worker: Window & typeof globalThis;
  private readonly handlers: {
    [Method in keyof Methods]: (
      ...params: Methods[Method]
    ) => HandlerReturn<Results[Method]>;
  };
  private isListening = false;

  constructor(
    worker: Window & typeof globalThis,
    handlers: {
      [Method in keyof Methods]: (
        ...params: Methods[Method]
      ) => HandlerReturn<Results[Method]>;
    }
  ) {
    this.worker = worker;
    this.handlers = handlers;
  }

  listen() {
    if (this.isListening) return;
    this.isListening = true;
    this.worker.addEventListener(
      "message",
      (e: MessageEvent<ClientRequest<Methods> | { id?: undefined }>) => {
        const message = e.data;
        if (message.id === undefined) return;

        const { id, method, params } = message;
        const result = this.handlers[method](...params);
        Promise.resolve(result).then((v) => {
          if (isTransferResult(v)) {
            this.worker.postMessage({ id, result: v.result }, { transfer: v.transfer });
            return;
          }
          this.worker.postMessage({ id, result: v });
        });
      },
    );
  }

  emit<K extends keyof Events>(
    event: K,
    data: Events[K],
    transfer: Transferable[] = []
  ) {
    this.worker.postMessage({ event, data }, { transfer });
  }
}
