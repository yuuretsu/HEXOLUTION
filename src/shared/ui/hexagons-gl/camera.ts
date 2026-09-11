import type { CameraState } from "./types";

export const updateCameraZoom = (
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
