import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ForwardedRef,
  type MouseEvent,
  type Touch,
  type TouchEvent,
  type WheelEvent,
} from "react";
import {
  centerCameraOnWorld,
  createCamera,
  getDeviceScale,
  panCamera,
  zoomCamera,
} from "./camera";
import { getDpr, getZoomFactor, pickHexCell } from "./hex-coords";
import { HexagonsRenderer } from "./gl-renderer";
import type { HexagonsGlHandle, HexagonsGlProps, WorldSize } from "./types";
import vertexSource from "./vertex.glsl?raw";
import fragmentSource from "./fragment.glsl?raw";

export const useHexagonsGl = (
  ref: ForwardedRef<HexagonsGlHandle>,
  { onClickPixel, isWrap = true, isTouchpadMode = false }: HexagonsGlProps,
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<HexagonsRenderer | null>(null);
  const camera = useRef(createCamera());
  const worldSize = useRef<WorldSize>({ width: 0, height: 0 });
  const wrapRef = useRef(isWrap);
  const isInitialized = useRef(false);
  const savedBodyCursor = useRef<string | null>(null);
  const savedBodyPriority = useRef("");
  const dragInfo = useRef({
    isDragging: false,
    hasMoved: false,
    lastX: 0,
    lastY: 0,
    lastDist: 0,
    lastMidX: 0,
    lastMidY: 0,
  });

  useEffect(() => {
    wrapRef.current = isWrap;
  }, [isWrap]);

  const stopDragging = useCallback(() => {
    dragInfo.current.isDragging = false;
    dragInfo.current.lastDist = 0;
    if (savedBodyCursor.current === null) return;
    document.body.style.setProperty(
      "cursor",
      savedBodyCursor.current,
      savedBodyPriority.current,
    );
    savedBodyCursor.current = null;
    savedBodyPriority.current = "";
  }, []);

  const handleCanvasClick = useCallback((clientX: number, clientY: number) => {
    if (!onClickPixel || !canvasRef.current) return;
    const cell = pickHexCell(
      clientX,
      clientY,
      canvasRef.current.getBoundingClientRect(),
      camera.current,
      getDeviceScale(camera.current),
      worldSize.current,
      wrapRef.current,
    );
    if (cell) onClickPixel(cell.col, cell.row);
  }, [onClickPixel]);

  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      if (!dragInfo.current.isDragging) return;

      const dx = e.clientX - dragInfo.current.lastX;
      const dy = e.clientY - dragInfo.current.lastY;

      if (!dragInfo.current.hasMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        dragInfo.current.hasMoved = true;
        if (savedBodyCursor.current === null) {
          savedBodyCursor.current = document.body.style.cursor;
          savedBodyPriority.current = document.body.style.getPropertyPriority("cursor");
        }
        document.body.style.setProperty("cursor", "grabbing", "important");
      }

      const dpr = getDpr();
      panCamera(camera.current, dx * dpr, dy * dpr);
      dragInfo.current.lastX = e.clientX;
      dragInfo.current.lastY = e.clientY;
    };

    const onUp = (e: globalThis.MouseEvent) => {
      if (!dragInfo.current.isDragging) return;
      if (!dragInfo.current.hasMoved) handleCanvasClick(e.clientX, e.clientY);
      stopDragging();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [handleCanvasClick, stopDragging]);

  useImperativeHandle(ref, () => ({
    updateBuffer: (buffer, w, h) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      const needsCentering = !isInitialized.current && w > 0;
      worldSize.current = { width: w, height: h };
      renderer.upload(buffer, w, h);

      const container = containerRef.current;
      if (needsCentering && container) {
        centerCameraOnWorld(camera.current, w, h, container);
        isInitialized.current = true;
      }
    },
  }));

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = HexagonsRenderer.create(canvas, vertexSource, fragmentSource);
    if (!renderer) return;
    rendererRef.current = renderer;

    const resize = () => {
      renderer.resize(containerRef.current, (dx, dy) => {
        panCamera(camera.current, dx, dy);
      });
    };

    const resizeObserver = new ResizeObserver(resize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", resize);
    resize();

    return () => {
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    let frameId = 0;
    const render = () => {
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.draw(
          worldSize.current,
          camera.current,
          getDeviceScale(camera.current),
          wrapRef.current,
        );
      }
      frameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleWheel = (e: WheelEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dpr = getDpr();
    const zoomAtCursor = (factor: number) => {
      zoomCamera(
        camera.current,
        (e.clientX - rect.left) * dpr,
        (e.clientY - rect.top) * dpr,
        factor,
      );
    };

    if (isTouchpadMode && !e.ctrlKey) {
      panCamera(camera.current, -e.deltaX * dpr, -e.deltaY * dpr);
      return;
    }

    if (e.ctrlKey) {
      zoomAtCursor(getZoomFactor(e.deltaY));
      return;
    }

    if (!isTouchpadMode) {
      e.preventDefault();
      zoomAtCursor(getZoomFactor(e.deltaY));
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (isTouchpadMode) {
      if (e.button === 0) handleCanvasClick(e.clientX, e.clientY);
      return;
    }

    dragInfo.current.isDragging = true;
    dragInfo.current.hasMoved = false;
    dragInfo.current.lastX = e.clientX;
    dragInfo.current.lastY = e.clientY;
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      dragInfo.current.isDragging = true;
      dragInfo.current.hasMoved = false;
      dragInfo.current.lastX = e.touches[0].clientX;
      dragInfo.current.lastY = e.touches[0].clientY;
      return;
    }

    if (e.touches.length !== 2) return;

    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    dragInfo.current.lastDist = Math.sqrt(dx * dx + dy * dy);
    dragInfo.current.lastMidX = (t1.clientX + t2.clientX) / 2;
    dragInfo.current.lastMidY = (t1.clientY + t2.clientY) / 2;
    e.preventDefault();
  };

  const panFromTouch = (touch: Touch, dpr: number) => {
    const dx = touch.clientX - dragInfo.current.lastX;
    const dy = touch.clientY - dragInfo.current.lastY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragInfo.current.hasMoved = true;
    panCamera(camera.current, dx * dpr, dy * dpr);
    dragInfo.current.lastX = touch.clientX;
    dragInfo.current.lastY = touch.clientY;
  };

  const pinchFromTouches = (t1: Touch, t2: Touch, dpr: number, rect: DOMRect) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const midX = (t1.clientX + t2.clientX) / 2;
    const midY = (t1.clientY + t2.clientY) / 2;
    panCamera(
      camera.current,
      (midX - dragInfo.current.lastMidX) * dpr,
      (midY - dragInfo.current.lastMidY) * dpr,
    );
    if (dragInfo.current.lastDist > 0) {
      zoomCamera(
        camera.current,
        (midX - rect.left) * dpr,
        (midY - rect.top) * dpr,
        dist / dragInfo.current.lastDist,
      );
    }
    dragInfo.current.lastDist = dist;
    dragInfo.current.lastMidX = midX;
    dragInfo.current.lastMidY = midY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dpr = getDpr();
    if (e.touches.length === 1 && dragInfo.current.isDragging) {
      panFromTouch(e.touches[0], dpr);
      return;
    }

    if (e.touches.length === 2) {
      pinchFromTouches(e.touches[0], e.touches[1], dpr, rect);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (dragInfo.current.isDragging && !dragInfo.current.hasMoved && e.changedTouches.length > 0) {
      handleCanvasClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
    stopDragging();
  };

  return {
    containerRef,
    canvasRef,
    handleWheel,
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
