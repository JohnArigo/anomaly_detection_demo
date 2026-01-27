import type { JoinedRow } from "../../data/types";
import { coreMetrics, driverMetricKeys } from "../../data/metricConfig";
import { formatRate, formatScore } from "../../utils/format";

type Driver = {
  key: string;
  label: string;
  value: number;
  nnAvg: number;
  delta: number;
  p25: number;
  p75: number;
  med: number;
  rz: number;
  wt: number;
};

const rzLabel = (value: number) => {
  const abs = Math.abs(value);
  if (abs < 1) return "Typical";
  if (abs < 2.5) return "Somewhat unusual";
  return "Strongly unusual";
};

const metricLabel = (key: string) =>
  coreMetrics.find((metric) => metric.key === key)?.label ?? key;

const toDriver = (row: JoinedRow, key: string): Driver | null => {
  const value = Number(row[key]);
  const rz = Number(row[`rz_${key}`]);
  const wt = Number(row[`wt_${key}`]);
  const med = Number(row[`med_${key}`]);
  const p25 = Number(row[`p25_${key}`]);
  const p75 = Number(row[`p75_${key}`]);
  const nnAvg = Number(row[`nn_avg_${key}`]);
  const delta = Number(row[`delta_vs_nn_${key}`]);
  if ([value, rz, wt, med, p25, p75, nnAvg, delta].some((v) => Number.isNaN(v))) {
    return null;
  }
  return {
    key,
    label: metricLabel(key),
    value,
    nnAvg,
    delta,
    p25,
    p75,
    med,
    rz,
    wt,
  };
};

type DriversPanelProps = {
  row: JoinedRow;
  maxItems?: number;
};

export const DriversPanel = ({ row, maxItems = 3 }: DriversPanelProps) => {
  const drivers = driverMetricKeys
    .map((key) => toDriver(row, key))
    .filter((item): item is Driver => Boolean(item))
    .map((item) => ({
      ...item,
      score: item.wt * Math.abs(item.rz),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);

  if (drivers.length === 0) {
    return <div className="drivers-empty">No driver data available.</div>;
  }

  return (
    <div className="drivers">
      {drivers.map((driver) => (
        <div key={driver.key} className="driver">
          <div className="driver__header">
            <div className="driver__label">{driver.label}</div>
            <div className="driver__weight">{formatRate(driver.wt, 1)} weight</div>
          </div>
          <div className="driver__grid">
            <div className="driver__metric">
              <span className="driver__metricLabel">Value</span>
              <span className="driver__metricValue">{formatScore(driver.value, 2)}</span>
            </div>
            <div className="driver__metric">
              <span className="driver__metricLabel">Peer Avg</span>
              <span className="driver__metricValue">{formatScore(driver.nnAvg, 2)}</span>
            </div>
            <div className="driver__metric">
              <span className="driver__metricLabel">Delta vs Peers</span>
              <span className="driver__metricValue">
                {formatScore(driver.delta, 2)}
              </span>
            </div>
            <div className="driver__metric">
              <span className="driver__metricLabel">Typical Range</span>
              <span className="driver__metricValue">
                {formatScore(driver.p25, 2)}–{formatScore(driver.p75, 2)}
              </span>
            </div>
            <div className="driver__metric">
              <span className="driver__metricLabel">Median</span>
              <span className="driver__metricValue">{formatScore(driver.med, 2)}</span>
            </div>
            <div className="driver__metric">
              <span className="driver__metricLabel">RZ</span>
              <span className="driver__metricValue">
                {formatScore(driver.rz, 2)} · {rzLabel(driver.rz)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
