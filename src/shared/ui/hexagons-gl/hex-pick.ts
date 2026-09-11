export const getDpr = () => window.devicePixelRatio || 1;

export const getZoomFactor = (deltaY: number) => (deltaY > 0 ? 0.95 : 1.05);

export const cubeRound = (fracX: number, fracY: number, fracZ: number) => {
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

export const resolveClickCell = (
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
