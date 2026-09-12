import { getDpr } from "./hex-coords";
import type { CameraState, WorldSize } from "./types";

type GlUniforms = {
  uResolution: WebGLUniformLocation;
  uWorldSize: WebGLUniformLocation;
  uOffset: WebGLUniformLocation;
  uScale: WebGLUniformLocation;
  uWrap: WebGLUniformLocation;
};

type GlResources = {
  gl: WebGLRenderingContext;
  texture: WebGLTexture;
  program: WebGLProgram;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  vBuffer: WebGLBuffer | null;
  uniforms: GlUniforms;
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

const readUniforms = (gl: WebGLRenderingContext, program: WebGLProgram): GlUniforms | null => {
  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uWorldSize = gl.getUniformLocation(program, "uWorldSize");
  const uOffset = gl.getUniformLocation(program, "uOffset");
  const uScale = gl.getUniformLocation(program, "uScale");
  const uWrap = gl.getUniformLocation(program, "uWrap");
  if (!uResolution || !uWorldSize || !uOffset || !uScale || !uWrap) return null;
  return { uResolution, uWorldSize, uOffset, uScale, uWrap };
};

export class HexagonsRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly resources: GlResources;

  private constructor(canvas: HTMLCanvasElement, resources: GlResources) {
    this.canvas = canvas;
    this.resources = resources;
  }

  static create(
    canvas: HTMLCanvasElement,
    vertexSource: string,
    fragmentSource: string,
  ): HexagonsRenderer | null {
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

    return new HexagonsRenderer(canvas, {
      gl,
      texture,
      program: linked.program,
      vertexShader: linked.vertexShader,
      fragmentShader: linked.fragmentShader,
      vBuffer,
      uniforms,
    });
  }

  dispose() {
    const { gl, texture, program, vertexShader, fragmentShader, vBuffer } = this.resources;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (vBuffer) gl.deleteBuffer(vBuffer);
    gl.deleteTexture(texture);
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
  }

  resize(container: HTMLElement | null, panBy: (dx: number, dy: number) => void) {
    const rect = container?.getBoundingClientRect();
    if (!rect) return;

    const dpr = getDpr();
    const newWidth = rect.width * dpr;
    const newHeight = rect.height * dpr;

    if (this.canvas.width > 0 && this.canvas.height > 0) {
      panBy((newWidth - this.canvas.width) / 2, (newHeight - this.canvas.height) / 2);
    }

    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.resources.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  upload(buffer: Uint8Array, width: number, height: number) {
    const { gl, texture } = this.resources;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
  }

  draw(
    worldSize: WorldSize,
    camera: CameraState,
    deviceScale: number,
    isWrapEnabled: boolean,
  ) {
    const { gl, uniforms } = this.resources;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uniforms.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(uniforms.uWorldSize, worldSize.width, worldSize.height);
    gl.uniform2f(uniforms.uOffset, camera.x, camera.y);
    gl.uniform1f(uniforms.uScale, deviceScale);
    gl.uniform1i(uniforms.uWrap, isWrapEnabled ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
