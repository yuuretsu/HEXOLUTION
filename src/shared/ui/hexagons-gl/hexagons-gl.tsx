import { forwardRef } from "react";
import styles from "./styles.module.css";
import type { HexagonsGlHandle, HexagonsGlProps } from "./types";
import { useHexagonsGl } from "./use-hexagons-gl";

export const HexagonsGl = forwardRef<HexagonsGlHandle, HexagonsGlProps>(
  (props, ref) => {
    const {
      containerRef,
      canvasRef,
      handleWheel,
      handleMouseDown,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    } = useHexagonsGl(ref, props);

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
  },
);
