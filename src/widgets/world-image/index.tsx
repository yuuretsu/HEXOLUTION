import { useEffect, useRef, type FC } from "react";
import { useViewMode } from "@/features/change-view-mode/use-view-mode";
import { useGeneMeta } from "@/shared/hooks/use-gene-meta";
import { colorizeGrid } from "@/shared/render/grid-colorizer";
import { HexagonsGl, useHexagonsApi } from "@/shared/ui/hexagons-gl";
import type { GridBufferMeta, GeneMeta } from "@hexolution/simulation";
import type { ViewMode } from "@/shared/types";
import { workerApi } from "@/shared/worker-client";

export type WorldImageProps = {
  onClickPixel?: (x: number, y: number) => void;
  isTouchpadMode?: boolean;
};

export const WorldImage: FC<WorldImageProps> = ({ onClickPixel, isTouchpadMode = false }) => {
  const [apiRef, updateBuffer] = useHexagonsApi();
  const { viewMode } = useViewMode();
  const geneMeta = useGeneMeta();
  const lastGridRef = useRef<GridBufferMeta | null>(null);
  const viewModeRef = useRef<ViewMode>(viewMode);
  const geneMetaRef = useRef<GeneMeta[]>(geneMeta);

  useEffect(() => {
    viewModeRef.current = viewMode;
    geneMetaRef.current = geneMeta;
  }, [viewMode, geneMeta]);

  useEffect(() => {
    const grid = lastGridRef.current;
    if (!grid) return;
    const rgba = colorizeGrid({
      gridBuffer: grid.buffer,
      width: grid.width,
      height: grid.height,
      stride: grid.stride,
      layoutVersion: grid.layoutVersion,
      viewMode,
      geneMeta,
    });
    if (rgba) updateBuffer(new Uint8Array(rgba.buffer), rgba.width, rgba.height);
  }, [viewMode, geneMeta, updateBuffer]);

  useEffect(() => {
    let isActive = true;
    const poll = async () => {
      while (isActive) {
        const result = await workerApi.call("getLatestGrid", []);
        if (result) {
          const previous = lastGridRef.current;
          lastGridRef.current = result;
          if (previous) {
            void workerApi.call("returnGrid", [previous.buffer], [previous.buffer]);
          }
          if (isActive) {
            const rgba = colorizeGrid({
              gridBuffer: result.buffer,
              width: result.width,
              height: result.height,
              stride: result.stride,
              layoutVersion: result.layoutVersion,
              viewMode: viewModeRef.current,
              geneMeta: geneMetaRef.current,
            });
            if (rgba) {
              updateBuffer(new Uint8Array(rgba.buffer), rgba.width, rgba.height);
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 / 30));
      }
    };
    void poll();
    return () => {
      isActive = false;
      const previous = lastGridRef.current;
      lastGridRef.current = null;
      if (previous) {
        void workerApi.call("returnGrid", [previous.buffer], [previous.buffer]);
      }
    };
  }, [updateBuffer]);

  return (
    <HexagonsGl
      ref={apiRef}
      onClickPixel={onClickPixel}
      isTouchpadMode={isTouchpadMode}
    />
  );
};
