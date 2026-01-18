import type { FilterState } from "./filters";

const shiftDate = (value: Date, days: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const toLocalDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const createDefaultFilters = (anchor: Date): FilterState => {
  const end = new Date(anchor);
  const start = shiftDate(anchor, -30);

  return {
    dateRange: {
      start: toLocalDateInput(start),
      end: toLocalDateInput(end),
      label: "Last 30d",
    },
    locations: [],
    deviceIdQuery: "",
    personQuery: "",
    includeApproved: true,
    includeDenied: true,
    afterHoursOnly: false,
    flaggedOnly: false,
    flags: [],
    anomalyRange: { min: 0, max: 100 },
    includeZeroEvents: false,
  };
};
