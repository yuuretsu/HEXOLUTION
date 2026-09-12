import { HEX_ASPECT } from "@/shared/constants";
import { getDpr } from "./hex-coords";
import type { CameraState } from "./types";

export const createCamera = (): CameraState => ({ x: 0, y: 0, scale: 10 });

export const getDeviceScale = (camera: CameraState) => camera.scale * getDpr();

export const panCamera = (camera: CameraState, dx: number, dy: number) => {
  camera.x += dx;
  camera.y += dy;
};

export const zoomCamera = (
  camera: CameraState,
  centerX: number,
  centerY: number,
  factor: number,
) => {
  const oldScale = camera.scale;
  const newScale = Math.min(Math.max(oldScale * factor, 3), 100);
  camera.x = centerX - (centerX - camera.x) * (newScale / oldScale);
  camera.y = centerY - (centerY - camera.y) * (newScale / oldScale);
  camera.scale = newScale;
};

export const centerCameraOnWorld = (
  camera: CameraState,
  width: number,
  height: number,
  container: HTMLElement,
) => {
  if (width <= 0) return;
  const dpr = getDpr();
  const rect = container.getBoundingClientRect();
  const deviceScale = getDeviceScale(camera);
  camera.x = (rect.width * dpr) / 2 - (width * deviceScale) / 2;
  camera.y = (rect.height * dpr) / 2 - (height * deviceScale * HEX_ASPECT) / 2;
};
