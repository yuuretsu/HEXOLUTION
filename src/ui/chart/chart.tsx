import { memo, useMemo } from "react";

type DataPoint = [number, number];

interface Series {
  label: string;
  data: DataPoint[];
  color: string;
}

interface ChartProps {
  series: Series[];
  width?: number;
  height?: number;
  /** Data density: 0.1 for low detail, 1.0 for max detail. */
  precision?: number;
}

/**
 * Largest-Triangle-Three-Buckets (LTTB) algorithm for downsampling.
 * Reduces the number of points while preserving visual peaks and troughs.
 */
const simplify = (data: DataPoint[], limit: number): DataPoint[] => {
  const size = data.length;
  if (limit >= size || limit < 3) return data;

  const result: DataPoint[] = new Array(limit);
  result[0] = data[0];
  result[limit - 1] = data[size - 1];

  const bucketSize = (size - 2) / (limit - 2);
  let a = 0;

  for (let i = 0; i < limit - 2; i++) {
    let avgX = 0, avgY = 0;
    const start = Math.floor((i + 1) * bucketSize) + 1;
    const end = Math.min(Math.floor((i + 2) * bucketSize) + 1, size);

    for (let j = start; j < end; j++) {
      avgX += data[j][0];
      avgY += data[j][1];
    }
    const len = end - start;
    avgX /= len; avgY /= len;

    const rStart = Math.floor(i * bucketSize) + 1;
    const rEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, size);

    const [pAX, pAY] = data[a];
    let maxArea = -1, nextA = rStart;

    for (let j = rStart; j < rEnd; j++) {
      const area = Math.abs((pAX - avgX) * (data[j][1] - pAY) - (pAX - data[j][0]) * (avgY - pAY));
      if (area > maxArea) {
        maxArea = area;
        nextA = j;
      }
    }
    result[i + 1] = data[nextA];
    a = nextA;
  }
  return result;
};

interface ChartLineProps {
  data: DataPoint[];
  color: string;
  width: number;
  height: number;
  minX: number;
  scaleX: number;
  scaleY: number;
  maxPoints: number;
}

const ChartLine = memo(({ data, color, width, height, minX, scaleX, scaleY, maxPoints }: ChartLineProps) => {
  const pointsString = useMemo(() => {
    const points = simplify(data, maxPoints);
    let path = "";
    for (let i = 0; i < points.length; i++) {
      const x = ((points[i][0] - minX) / scaleX) * width;
      const y = height - (points[i][1] / scaleY) * height;
      path += `${x.toFixed(1)},${y.toFixed(1)} `;
    }
    return path;
  }, [data, minX, scaleX, scaleY, width, height, maxPoints]);

  return (
    <g>
      <polyline
        style={{ filter: "blur(8px) saturate(4)" }}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pointsString}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pointsString}
      />
    </g>
  );
});

ChartLine.displayName = "ChartLine";

export const Chart = ({
  series,
  width = 500,
  height = 300,
  precision = 0.5
}: ChartProps) => {
  const maxPoints = useMemo(() => Math.max(30, Math.floor(width * precision)), [width, precision]);

  const scene = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasData = false;

    for (let i = 0; i < series.length; i++) {
      const d = series[i].data;
      for (let j = 0; j < d.length; j++) {
        if (d[j][0] < minX) minX = d[j][0];
        if (d[j][0] > maxX) maxX = d[j][0];
        if (d[j][1] > maxY) maxY = d[j][1];
        hasData = true;
      }
    }
    return hasData ? { minX, sx: (maxX - minX) || 1, sy: maxY || 1 } : null;
  }, [series]);

  if (!scene) return null;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block" }}
        width="100%"
      >
        {series.map((s) => (
          <ChartLine
            key={s.label}
            data={s.data}
            color={s.color}
            width={width}
            height={height}
            minX={scene.minX}
            scaleX={scene.sx}
            scaleY={scene.sy}
            maxPoints={maxPoints}
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: 4,
          display: "flex",
          gap: 8,
          textTransform: "uppercase",
          fontSize: 16 * 0.75
        }}
      >
        {series.map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 4,
              padding: "0 0.25rem",
            }}
          >
            <div style={{ width: 2, height: 8, backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
};
