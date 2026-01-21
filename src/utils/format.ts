import { round } from "./math";

export const formatNumber = (value: number) => {
  return value.toLocaleString("en-US");
};

export const formatPercent = (value: number, decimals = 0) => {
  return `${round(value, decimals).toFixed(decimals)}%`;
};

export const formatRatio = (value: number, decimals = 2) => {
  return round(value, decimals).toFixed(decimals);
};

export const formatScore = (value: number, decimals = 2) => {
  return round(value, decimals).toFixed(decimals);
};

export const formatAnomalyScore = (value: number, decimals = 4) => {
  const fixed = round(value, decimals).toFixed(decimals);
  return value >= 0 ? `+${fixed}` : fixed;
};

export const formatAnomalyScoreFull = (value: number, decimals = 6) => {
  const fixed = round(value, decimals).toFixed(decimals);
  return value >= 0 ? `+${fixed}` : fixed;
};
