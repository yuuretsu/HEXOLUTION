import {
  useRef,
  useLayoutEffect,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import styles from "./styles.module.css";
import { HEX_ASPECT, SQRT3 } from "@/shared/constants";
import vertexSource from "./vertex.glsl?raw";
import fragmentSource from "./fragment.glsl?raw";

export type HexagonsGlHandle = {
  updateBuffer: (buffer: Uint8Array, width: number, height: number) => void;
}

export type HexagonsGlProps = {
  onClickPixel?: (x: number, y: number) => void;
  isWrap?: boolean;
  isTouchpadMode?: boolean;
}

const getDpr = () => window.devicePixelRatio || 1;

const getZoomFactor = (deltaY: number) => (deltaY > 0 ? 0.95 : 1.05);

const cubeRound = (fracX: number, fracY: number, fracZ: number) => {
  let rx = Math.floor(fracX + 0.5);
  let ry = Math.floor(fracY + 0.5);
  let rz = Math.floor(fracZ + 0.5);
  const dx = Math.abs(rx - fracX);
  const dy = Math.abs(ry - fracY);
  const dz = Math.abs(rz - fracZ);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { x: rx, y: ry, z: rz };
};

const resolveClickCell = (
  col: number,
  row: number,
  width: number,
  height: number,
  isWrapEnabled: boolean,
): { col: number; row: number } | null => {
  if (isWrapEnabled) {
    return {
      col: Math.floor(((col % width) + width) % width),
      row: Math.floor(((row % height) + height) % height),
    };
  }

  if (col < 0 || col >= width || row < 0 || row >= height) return null;
  return { col: Math.floor(col), row: Math.floor(row) };
};

export const HexagonsGl = forwardRef<HexagonsGlHandle, HexagonsGlProps>(
  ({ onClickPixel, isWrap = true, isTouchpadMode = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const worldSize = useRef({ width: 0, height: 0 });
    const wrapRef = useRef(isWrap);
    const isInitialized = useRef(false);
    const savedBodyCursor = useRef<string | null>(null);
    const savedBodyPriority = useRef<string>("");

    const glRef = useRef<{
      gl: WebGLRenderingContext;
      texture: WebGLTexture;
      uniforms: Record<string, WebGLUniformLocation>;
    } | null>(null);

    const camera = useRef({ x: 0, y: 0, scale: 10 });
    const getDeviceScale = useCallback(
      () => camera.current.scale * getDpr(),
      []
    );
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
      if (savedBodyCursor.current !== null) {
        document.body.style.setProperty("cursor", savedBodyCursor.current, savedBodyPriority.current);
        savedBodyCursor.current = null;
        savedBodyPriority.current = "";
      }
    }, []);

    const handleCanvasClick = useCallback((clientX: number, clientY: number) => {
      const { width, height } = worldSize.current;
      if (!onClickPixel || !canvasRef.current || width <= 0) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const dpr = getDpr();
      const size = getDeviceScale() / SQRT3;
      const pixelX = (clientX - rect.left) * dpr - camera.current.x;
      const pixelY = (clientY - rect.top) * dpr - camera.current.y;
      const q = (SQRT3 / 3.0 * pixelX - 1.0 / 3.0 * pixelY) / size;
      const r = (2.0 / 3.0 * pixelY) / size;
      const rounded = cubeRound(q, -q - r, r);
      const col = rounded.x + (rounded.z - (Math.abs(rounded.z) % 2)) / 2;
      const cell = resolveClickCell(col, rounded.z, width, height, wrapRef.current);

      if (cell) onClickPixel(cell.col, cell.row);
    }, [onClickPixel, getDeviceScale]);

    useEffect(() => {
      const handleWindowMouseMove = (e: MouseEvent) => {
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
        camera.current.x += dx * dpr;
        camera.current.y += dy * dpr;
        dragInfo.current.lastX = e.clientX;
        dragInfo.current.lastY = e.clientY;
      };

      const handleWindowMouseUp = (e: MouseEvent) => {
        if (dragInfo.current.isDragging) {
          if (!dragInfo.current.hasMoved) handleCanvasClick(e.clientX, e.clientY);
          stopDragging();
        }
      };

      window.addEventListener("mousemove", handleWindowMouseMove);
      window.addEventListener("mouseup", handleWindowMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleWindowMouseMove);
        window.removeEventListener("mouseup", handleWindowMouseUp);
      };
    }, [handleCanvasClick, stopDragging]);

    const centerCamera = (w: number, h: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || w <= 0) return;
      const dpr = getDpr();
      const rect = container.getBoundingClientRect();
      const deviceScale = getDeviceScale();
      const worldPixelWidth = w * deviceScale;
      const worldPixelHeight = h * deviceScale * HEX_ASPECT;
      camera.current.x = (rect.width * dpr) / 2 - worldPixelWidth / 2;
      camera.current.y = (rect.height * dpr) / 2 - worldPixelHeight / 2;
      isInitialized.current = true;
    };

    useImperativeHandle(ref, () => ({
      updateBuffer: (buffer, w, h) => {
        const state = glRef.current;
        if (!state) return;
        const needsCentering = !isInitialized.current && w > 0;
        worldSize.current = { width: w, height: h };
        const { gl, texture } = state;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
        if (needsCentering) centerCamera(w, h);
      },
    }));

    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false });
      if (!gl) return;

      const createShader = (type: number, source: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, source);
        gl.compileShader(s);
        return s;
      };

      const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
      const program = gl.createProgram()!;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
      const vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const posAttrib = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      glRef.current = {
        gl,
        texture,
        uniforms: {
          uResolution: gl.getUniformLocation(program, "uResolution")!,
          uWorldSize: gl.getUniformLocation(program, "uWorldSize")!,
          uOffset: gl.getUniformLocation(program, "uOffset")!,
          uScale: gl.getUniformLocation(program, "uScale")!,
          uWrap: gl.getUniformLocation(program, "uWrap")!,
        },
      };

      const resize = () => {
        const dpr = getDpr();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const newWidth = rect.width * dpr;
          const newHeight = rect.height * dpr;

          if (canvas.width > 0 && canvas.height > 0) {
            const dx = newWidth - canvas.width;
            const dy = newHeight - canvas.height;
            camera.current.x += dx / 2;
            camera.current.y += dy / 2;
          }

          canvas.width = newWidth;
          canvas.height = newHeight;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
      };

      const resizeObserver = new ResizeObserver(() => resize());
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener("resize", resize);
      resize();

      return () => {
        window.removeEventListener("resize", resize);
        resizeObserver.disconnect();
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (vBuffer) gl.deleteBuffer(vBuffer);
        gl.deleteTexture(texture);
        gl.detachShader(program, vertexShader);
        gl.detachShader(program, fragmentShader);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteProgram(program);
        glRef.current = null;
      };
    }, []);

    useEffect(() => {
      let frameId: number;
      const render = () => {
        if (glRef.current && canvasRef.current) {
          const { gl, uniforms } = glRef.current;
          const canvas = canvasRef.current;
          const { width, height } = worldSize.current;
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
          gl.uniform2f(uniforms.uWorldSize, width, height);
          gl.uniform2f(uniforms.uOffset, camera.current.x, camera.current.y);
          gl.uniform1f(uniforms.uScale, getDeviceScale());
          gl.uniform1i(uniforms.uWrap, wrapRef.current ? 1 : 0);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        frameId = requestAnimationFrame(render);
      };
      render();
      return () => cancelAnimationFrame(frameId);
    }, [getDeviceScale]);

    const updateZoom = (centerX: number, centerY: number, factor: number) => {
      const oldScale = camera.current.scale;
      const newScale = Math.min(Math.max(oldScale * factor, 3), 100);
      camera.current.x = centerX - (centerX - camera.current.x) * (newScale / oldScale);
      camera.current.y = centerY - (centerY - camera.current.y) * (newScale / oldScale);
      camera.current.scale = newScale;
    };

    const handleWheel = (e: React.WheelEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dpr = getDpr();
      const zoomAtCursor = (factor: number) => {
        updateZoom(
          (e.clientX - rect.left) * dpr,
          (e.clientY - rect.top) * dpr,
          factor,
        );
      };

      if (isTouchpadMode && !e.ctrlKey) {
        camera.current.x -= e.deltaX * dpr;
        camera.current.y -= e.deltaY * dpr;
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

    const handleMouseDown = (e: React.MouseEvent) => {
      if (isTouchpadMode) {
        if (e.button === 0) {
          handleCanvasClick(e.clientX, e.clientY);
        }
        return;
      }

      dragInfo.current.isDragging = true;
      dragInfo.current.hasMoved = false;
      dragInfo.current.lastX = e.clientX;
      dragInfo.current.lastY = e.clientY;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        dragInfo.current.isDragging = true;
        dragInfo.current.hasMoved = false;
        dragInfo.current.lastX = e.touches[0].clientX;
        dragInfo.current.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1];
        const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
        dragInfo.current.lastDist = Math.sqrt(dx * dx + dy * dy);
        dragInfo.current.lastMidX = (t1.clientX + t2.clientX) / 2;
        dragInfo.current.lastMidY = (t1.clientY + t2.clientY) / 2;
        e.preventDefault();
      }
    };

    const panFromTouch = (touch: React.Touch, dpr: number) => {
      const dx = touch.clientX - dragInfo.current.lastX;
      const dy = touch.clientY - dragInfo.current.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragInfo.current.hasMoved = true;
      camera.current.x += dx * dpr;
      camera.current.y += dy * dpr;
      dragInfo.current.lastX = touch.clientX;
      dragInfo.current.lastY = touch.clientY;
    };

    const pinchFromTouches = (
      t1: React.Touch,
      t2: React.Touch,
      dpr: number,
      rect: DOMRect,
    ) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      camera.current.x += (midX - dragInfo.current.lastMidX) * dpr;
      camera.current.y += (midY - dragInfo.current.lastMidY) * dpr;
      if (dragInfo.current.lastDist > 0) {
        updateZoom((midX - rect.left) * dpr, (midY - rect.top) * dpr, dist / dragInfo.current.lastDist);
      }
      dragInfo.current.lastDist = dist;
      dragInfo.current.lastMidX = midX;
      dragInfo.current.lastMidY = midY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
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

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (dragInfo.current.isDragging && !dragInfo.current.hasMoved && e.changedTouches.length > 0) {
        handleCanvasClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      stopDragging();
    };

    return (
      <div ref={containerRef} className={styles.wrapper}>
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={styles.canvas}
        />
      </div>
    );
  }
);
