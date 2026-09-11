import { useEffect, type FC } from "react";
import { workerApi } from "@/shared/worker-client";
import { HexagonsGl, useHexagonsApi } from "@/shared/ui/hexagons-gl";

export type WorldImageProps = {
  onClickPixel?: (x: number, y: number) => void;
  isTouchpadMode?: boolean;
}

export const WorldImage: FC<WorldImageProps> = ({ onClickPixel, isTouchpadMode = false }) => {
  const [apiRef, updateBuffer] = useHexagonsApi();

  useEffect(() => {
    let active = true;
    const poll = async () => {
      while (active) {
        try {
          const result = await workerApi.call("getLatestFrame", []);
          if (result && active) {
            updateBuffer(
              new Uint8Array(result.buffer),
              result.width,
              result.height
            );
          }
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (!active) break;
          continue;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 / 30));
      }
    };
    poll();
    return () => { active = false; };
  }, [updateBuffer]);

  return (
    <HexagonsGl
      ref={apiRef}
      onClickPixel={onClickPixel}
      isTouchpadMode={isTouchpadMode}
    />
  );
};
