import { useCallback, useEffect, useRef } from "react";
import { HEX_ASPECT } from "@/shared/constants";
import { getDpr } from "./hex-pick";
import { updateCameraZoom } from "./camera";
import type { CameraState, WorldSize } from "./types";

export const useHexagonsViewport = (isWrap: boolean) => {
  const camera = useRef<CameraState>({ x: 0, y: 0, scale: 10 });
  const worldSize = useRef<WorldSize>({ width: 0, height: 0 });
  const wrapRef = useRef(isWrap);

  useEffect(() => {
    wrapRef.current = isWrap;
  }, [isWrap]);

  const getDeviceScale = useCallback(
    () => camera.current.scale * getDpr(),
    [],
  );

  const getCamera = useCallback(() => camera.current, []);
  const getWorldSize = useCallback(() => worldSize.current, []);
  const getIsWrapEnabled = useCallback(() => wrapRef.current, []);

  const setWorldSize = useCallback((width: number, height: number) => {
    worldSize.current = { width, height };
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    camera.current.x += dx;
    camera.current.y += dy;
  }, []);

  const zoomAt = useCallback((centerX: number, centerY: number, factor: number) => {
    updateCameraZoom(camera.current, centerX, centerY, factor);
  }, []);

  const centerOnWorld = useCallback((
    width: number,
    height: number,
    container: HTMLElement,
  ) => {
    if (width <= 0) return;
    const dpr = getDpr();
    const rect = container.getBoundingClientRect();
    const deviceScale = getDeviceScale();
    camera.current.x = (rect.width * dpr) / 2 - (width * deviceScale) / 2;
    camera.current.y = (rect.height * dpr) / 2 - (height * deviceScale * HEX_ASPECT) / 2;
  }, [getDeviceScale]);

  return {
    getCamera,
    getWorldSize,
    getIsWrapEnabled,
    getDeviceScale,
    setWorldSize,
    panBy,
    zoomAt,
    centerOnWorld,
  };
};

export type HexagonsViewport = ReturnType<typeof useHexagonsViewport>;
