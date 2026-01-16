export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const round = (value: number, decimals = 0) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export const percentileRank = (values: number[], value: number) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  let less = 0;
  let equal = 0;
  for (const v of sorted) {
    if (v < value) less += 1;
    if (v === value) equal += 1;
  }
  const rank = (less + 0.5 * equal) / sorted.length;
  return Math.round(rank * 100);
};
