import type { GlState } from "./types";

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
