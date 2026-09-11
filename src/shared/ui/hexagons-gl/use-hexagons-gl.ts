import { useRef, type ForwardedRef } from "react";
import type { HexagonsGlHandle, HexagonsGlProps } from "./types";
import { useHexagonsGlRender } from "./use-hexagons-gl-render";
import { useHexagonsInteraction } from "./use-hexagons-interaction";
import { useHexagonsViewport } from "./use-hexagons-viewport";

export const useHexagonsGl = (
  ref: ForwardedRef<HexagonsGlHandle>,
  { onClickPixel, isWrap = true, isTouchpadMode = false }: HexagonsGlProps,
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewport = useHexagonsViewport(isWrap);

  useHexagonsGlRender({
    ref,
    containerRef,
    canvasRef,
    viewport,
  });

  const interaction = useHexagonsInteraction({
    canvasRef,
    viewport,
    onClickPixel,
    isTouchpadMode,
  });

  return {
    containerRef,
    canvasRef,
    ...interaction,
  };
};
