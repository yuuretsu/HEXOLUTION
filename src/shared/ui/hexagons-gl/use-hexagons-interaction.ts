import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type RefObject,
  type Touch,
  type TouchEvent,
  type WheelEvent,
} from "react";
import { SQRT3 } from "@/shared/constants";
import { cubeRound, getDpr, getZoomFactor, resolveClickCell } from "./hex-pick";
import type { HexagonsViewport } from "./use-hexagons-viewport";

type UseHexagonsInteractionArgs = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  viewport: HexagonsViewport;
  onClickPixel?: (x: number, y: number) => void;
  isTouchpadMode: boolean;
};

export const useHexagonsInteraction = ({
  canvasRef,
  viewport,
  onClickPixel,
  isTouchpadMode,
}: UseHexagonsInteractionArgs) => {
  const {
    getCamera,
    getWorldSize,
    getIsWrapEnabled,
    getDeviceScale,
    panBy,
    zoomAt,
  } = viewport;

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

  const stopDragging = useCallback(() => {
    dragInfo.current.isDragging = false;
    dragInfo.current.lastDist = 0;
    if (savedBodyCursor.current !== null) {
      document.body.style.setProperty(
        "cursor",
        savedBodyCursor.current,
        savedBodyPriority.current,
      );
      savedBodyCursor.current = null;
      savedBodyPriority.current = "";
    }
  }, []);

  const handleCanvasClick = useCallback((clientX: number, clientY: number) => {
    const { width, height } = getWorldSize();
    if (!onClickPixel || !canvasRef.current || width <= 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = getDpr();
    const camera = getCamera();
    const size = getDeviceScale() / SQRT3;
    const pixelX = (clientX - rect.left) * dpr - camera.x;
    const pixelY = (clientY - rect.top) * dpr - camera.y;
    const q = (SQRT3 / 3.0 * pixelX - 1.0 / 3.0 * pixelY) / size;
    const r = (2.0 / 3.0 * pixelY) / size;
    const rounded = cubeRound(q, -q - r, r);
    const col = rounded.x + (rounded.z - (Math.abs(rounded.z) % 2)) / 2;
    const cell = resolveClickCell(col, rounded.z, width, height, getIsWrapEnabled());

    if (cell) onClickPixel(cell.col, cell.row);
  }, [onClickPixel, canvasRef, getCamera, getDeviceScale, getIsWrapEnabled, getWorldSize]);

  useEffect(() => {
    const handleWindowMouseMove = (e: globalThis.MouseEvent) => {
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
      panBy(dx * dpr, dy * dpr);
      dragInfo.current.lastX = e.clientX;
      dragInfo.current.lastY = e.clientY;
    };

    const handleWindowMouseUp = (e: globalThis.MouseEvent) => {
      if (!dragInfo.current.isDragging) return;
      if (!dragInfo.current.hasMoved) handleCanvasClick(e.clientX, e.clientY);
      stopDragging();
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [handleCanvasClick, panBy, stopDragging]);

  const handleWheel = (e: WheelEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dpr = getDpr();
    const zoomAtCursor = (factor: number) => {
      zoomAt(
        (e.clientX - rect.left) * dpr,
        (e.clientY - rect.top) * dpr,
        factor,
      );
    };

    if (isTouchpadMode && !e.ctrlKey) {
      panBy(-e.deltaX * dpr, -e.deltaY * dpr);
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
    panBy(dx * dpr, dy * dpr);
    dragInfo.current.lastX = touch.clientX;
    dragInfo.current.lastY = touch.clientY;
  };

  const pinchFromTouches = (t1: Touch, t2: Touch, dpr: number, rect: DOMRect) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const midX = (t1.clientX + t2.clientX) / 2;
    const midY = (t1.clientY + t2.clientY) / 2;
    panBy(
      (midX - dragInfo.current.lastMidX) * dpr,
      (midY - dragInfo.current.lastMidY) * dpr,
    );
    if (dragInfo.current.lastDist > 0) {
      zoomAt(
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
    handleWheel,
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
