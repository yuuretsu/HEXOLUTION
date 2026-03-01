import { type FC } from 'react';

export type HexagonProps = {
  size: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
};

export const Hexagon: FC<HexagonProps> = ({
  size,
  color,
  strokeColor = "black",
  strokeWidth = 2
}) => {
  const sw = strokeWidth;
  const w = size * Math.sqrt(3);
  const h = size * 2;

  const totalW = w + sw;
  const totalH = h + sw;

  const points = [
    [w * 0.5 + sw * 0.5, sw * 0.5],
    [w + sw * 0.5, h * 0.25 + sw * 0.5],
    [w + sw * 0.5, h * 0.75 + sw * 0.5],
    [w * 0.5 + sw * 0.5, h + sw * 0.5],
    [sw * 0.5, h * 0.75 + sw * 0.5],
    [sw * 0.5, h * 0.25 + sw * 0.5]
  ].map(p => p.join(',')).join(' ');

  return (
    <svg
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      style={{ display: 'block' }}
    >
      <polygon
        points={points}
        fill={color}
        stroke={strokeColor}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </svg>
  );
};