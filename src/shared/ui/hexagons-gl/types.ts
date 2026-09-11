export type HexagonsGlHandle = {
  updateBuffer: (buffer: Uint8Array, width: number, height: number) => void;
};

export type HexagonsGlProps = {
  onClickPixel?: (x: number, y: number) => void;
  isWrap?: boolean;
  isTouchpadMode?: boolean;
};
