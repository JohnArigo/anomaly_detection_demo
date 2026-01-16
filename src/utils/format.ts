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
