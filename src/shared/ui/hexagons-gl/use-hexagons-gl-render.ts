import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ForwardedRef,
  type RefObject,
} from "react";
import vertexSource from "./vertex.glsl?raw";
import fragmentSource from "./fragment.glsl?raw";
import {
  createHexagonsGl,
  disposeHexagonsGl,
  drawHexagonsFrame,
  resizeHexagonsCanvas,
  uploadWorldTexture,
} from "./gl-setup";
import type { HexagonsGlHandle } from "./types";
import type { HexagonsViewport } from "./use-hexagons-viewport";

type UseHexagonsGlRenderArgs = {
  ref: ForwardedRef<HexagonsGlHandle>;
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  viewport: HexagonsViewport;
};

export const useHexagonsGlRender = ({
  ref,
  containerRef,
  canvasRef,
  viewport,
}: UseHexagonsGlRenderArgs) => {
  const {
    getCamera,
    getWorldSize,
    getIsWrapEnabled,
    getDeviceScale,
    setWorldSize,
    panBy,
    centerOnWorld,
  } = viewport;

  const glRef = useRef<ReturnType<typeof createHexagonsGl>>(null);
  const isInitialized = useRef(false);

  useImperativeHandle(ref, () => ({
    updateBuffer: (buffer, w, h) => {
      const state = glRef.current;
      if (!state) return;

      const needsCentering = !isInitialized.current && w > 0;
      setWorldSize(w, h);
      uploadWorldTexture(state, buffer, w, h);

      const container = containerRef.current;
      if (needsCentering && container) {
        centerOnWorld(w, h, container);
        isInitialized.current = true;
      }
    },
  }), [centerOnWorld, containerRef, setWorldSize]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = createHexagonsGl(canvas, vertexSource, fragmentSource);
    if (!state) return;
    glRef.current = state;

    const resize = () => {
      resizeHexagonsCanvas(state, canvas, containerRef.current, panBy);
    };

    const resizeObserver = new ResizeObserver(resize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    window.addEventListener("resize", resize);
    resize();

    return () => {
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      disposeHexagonsGl(state);
      glRef.current = null;
    };
  }, [canvasRef, containerRef, panBy]);

  useEffect(() => {
    let frameId = 0;

    const render = () => {
      const state = glRef.current;
      const canvas = canvasRef.current;
      if (state && canvas) {
        drawHexagonsFrame(
          state,
          canvas,
          getWorldSize(),
          getCamera(),
          getDeviceScale(),
          getIsWrapEnabled(),
        );
      }
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [canvasRef, getCamera, getDeviceScale, getIsWrapEnabled, getWorldSize]);
};
