import type { GeneMeta } from "@hexolution/simulation";
import { workerApi } from "./worker-client";

let meta: GeneMeta[] | null = null;
let pending: Promise<GeneMeta[]> | null = null;

export const loadGeneMeta = (): Promise<GeneMeta[]> => {
  if (meta) return Promise.resolve(meta);
  pending ??= workerApi.call("getGeneMeta", []).then((m) => {
    meta = m;
    return m;
  });
  return pending;
};

export const getCachedGeneMeta = (): GeneMeta[] => meta ?? [];
