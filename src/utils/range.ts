import type { FilterState } from "./filters";

const shiftDate = (value: Date, days: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const toIsoDate = (value: Date) => value.toISOString();

export const createDefaultFilters = (anchor: Date): FilterState => {
  const end = new Date(anchor);
  const start = shiftDate(anchor, -30);

  return {
    dateRange: {
      start: toIsoDate(start),
      end: toIsoDate(end),
      label: "Last 30d",
    },
    locations: [],
    deviceIdQuery: "",
    personQuery: "",
    outcome: "all",
    flags: [],
    anomalyRange: { min: 0, max: 100 },
  };
};
