import { useRef, useCallback } from "react";
import type { HexagonsGlHandle } from "./types";

export const useHexagonsApi = () => {
  const apiRef = useRef<HexagonsGlHandle>(null);
  const update = useCallback((buffer: Uint8Array, width: number, height: number) => {
    apiRef.current?.updateBuffer(buffer, width, height);
  }, []);

  return [apiRef, update] as const;
};
