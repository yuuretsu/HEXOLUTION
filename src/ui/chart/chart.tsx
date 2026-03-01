type TimeDataPoint = [number, number];

interface Series {
  label: string;
  points: TimeDataPoint[];
  color: string;
}

interface TimeSeriesChartProps {
  series: Series[];
  width?: number;
  height?: number;
}

export const Chart = ({
  series,
  width = 500,
  height = 300,
}: TimeSeriesChartProps) => {
  const points = series.flatMap(s => s.points);
  if (!points.length) return null;

  const minX = Math.min(...points.map(p => p[0]));
  const maxX = Math.max(...points.map(p => p[0]));
  const maxY = Math.max(...points.map(p => p[1]));

  const rangeX = (maxX - minX) || 1;
  const rangeY = maxY || 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%">
      {series.map(({ label, color, points: sPoints }) => (
        <polyline
          key={label}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={sPoints
            .map(([x, y]) =>
              `${((x - minX) / rangeX) * width},${height - (y / rangeY) * height}`
            )
            .join(' ')
          }
        />
      ))}
    </svg>
  );
};