import { useMemo } from "react";

export type DonutDatum = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  data: DonutDatum[];
  totalLabel: string;
  emptyLabel?: string;
};

const polar = (cx: number, cy: number, r: number, angle: number) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const donutPath = (cx: number, cy: number, r: number, inner: number, start: number, end: number) => {
  const startOuter = polar(cx, cy, r, start);
  const endOuter = polar(cx, cy, r, end);
  const startInner = polar(cx, cy, inner, end);
  const endInner = polar(cx, cy, inner, start);
  const largeArc = end - start > 180 ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
};

export const DonutChart = ({ data, totalLabel, emptyLabel = "No denies" }: DonutChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const arcs = useMemo(() => {
    if (total === 0) return [];
    let current = 0;
    return data.map((item) => {
      const start = (current / total) * 360;
      const end = ((current + item.value) / total) * 360;
      current += item.value;
      return {
        path: donutPath(90, 90, 70, 42, start, end),
        color: item.color,
        label: item.label,
      };
    });
  }, [data, total]);

  return (
    <div className="donut">
      <svg viewBox="0 0 180 180" role="img" aria-label="Denied reasons breakdown">
        {total === 0 && <circle cx="90" cy="90" r="70" className="donut__empty" />}
        {arcs.map((arc) => (
          <path key={arc.label} d={arc.path} fill={arc.color} />
        ))}
      </svg>
      <div className="donut__center">
        <div className="donut__value">{total}</div>
        <div className="donut__label">{total === 0 ? emptyLabel : totalLabel}</div>
      </div>
    </div>
  );
};
