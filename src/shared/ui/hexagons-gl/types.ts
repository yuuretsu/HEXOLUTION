export type HexagonsGlHandle = {
  updateBuffer: (buffer: Uint8Array, width: number, height: number) => void;
};

export type HexagonsGlProps = {
  onClickPixel?: (x: number, y: number) => void;
  isWrap?: boolean;
  isTouchpadMode?: boolean;
};

export type CameraState = {
  x: number;
  y: number;
  scale: number;
};

export type WorldSize = {
  width: number;
  height: number;
};
