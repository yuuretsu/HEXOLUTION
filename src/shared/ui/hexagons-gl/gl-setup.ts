import { getDpr } from "./hex-pick";

export type CameraState = {
  x: number;
  y: number;
  scale: number;
};

export type GlState = {
  gl: WebGLRenderingContext;
  texture: WebGLTexture;
  program: WebGLProgram;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  vBuffer: WebGLBuffer | null;
  uniforms: {
    uResolution: WebGLUniformLocation;
    uWorldSize: WebGLUniformLocation;
    uOffset: WebGLUniformLocation;
    uScale: WebGLUniformLocation;
    uWrap: WebGLUniformLocation;
  };
};

const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const createProgram = (
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
) => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return { program, vertexShader, fragmentShader };
};

const bindFullscreenQuad = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const posAttrib = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(posAttrib);
  gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
  return vBuffer;
};

const createNearestTexture = (gl: WebGLRenderingContext) => {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
};

const readUniforms = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uWorldSize = gl.getUniformLocation(program, "uWorldSize");
  const uOffset = gl.getUniformLocation(program, "uOffset");
  const uScale = gl.getUniformLocation(program, "uScale");
  const uWrap = gl.getUniformLocation(program, "uWrap");
  if (!uResolution || !uWorldSize || !uOffset || !uScale || !uWrap) return null;
  return { uResolution, uWorldSize, uOffset, uScale, uWrap };
};

export const createHexagonsGl = (
  canvas: HTMLCanvasElement,
  vertexSource: string,
  fragmentSource: string,
): GlState | null => {
  const gl = canvas.getContext("webgl", {
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  });
  if (!gl) return null;

  const linked = createProgram(gl, vertexSource, fragmentSource);
  if (!linked) return null;

  const vBuffer = bindFullscreenQuad(gl, linked.program);
  const texture = createNearestTexture(gl);
  const uniforms = readUniforms(gl, linked.program);
  if (!texture || !uniforms) return null;

  return {
    gl,
    texture,
    program: linked.program,
    vertexShader: linked.vertexShader,
    fragmentShader: linked.fragmentShader,
    vBuffer,
    uniforms,
  };
};

export const disposeHexagonsGl = (state: GlState) => {
  const { gl, texture, program, vertexShader, fragmentShader, vBuffer } = state;
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  if (vBuffer) gl.deleteBuffer(vBuffer);
  gl.deleteTexture(texture);
  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  gl.deleteProgram(program);
};

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
