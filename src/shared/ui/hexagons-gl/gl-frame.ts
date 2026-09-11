import { getDpr } from "./hex-pick";
import type { CameraState, GlState } from "./types";

export const resizeHexagonsCanvas = (
  state: GlState,
  canvas: HTMLCanvasElement,
  container: HTMLElement | null,
  panBy: (dx: number, dy: number) => void,
) => {
  const rect = container?.getBoundingClientRect();
  if (!rect) return;

  const dpr = getDpr();
  const newWidth = rect.width * dpr;
  const newHeight = rect.height * dpr;

  if (canvas.width > 0 && canvas.height > 0) {
    panBy((newWidth - canvas.width) / 2, (newHeight - canvas.height) / 2);
  }

  canvas.width = newWidth;
  canvas.height = newHeight;
  state.gl.viewport(0, 0, canvas.width, canvas.height);
};

export const uploadWorldTexture = (
  state: GlState,
  buffer: Uint8Array,
  width: number,
  height: number,
) => {
  const { gl, texture } = state;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
};

export const drawHexagonsFrame = (
  state: GlState,
  canvas: HTMLCanvasElement,
  worldSize: { width: number; height: number },
  camera: CameraState,
  deviceScale: number,
  isWrapEnabled: boolean,
) => {
  const { gl, uniforms } = state;
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
  gl.uniform2f(uniforms.uWorldSize, worldSize.width, worldSize.height);
  gl.uniform2f(uniforms.uOffset, camera.x, camera.y);
  gl.uniform1f(uniforms.uScale, deviceScale);
  gl.uniform1i(uniforms.uWrap, isWrapEnabled ? 1 : 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};
