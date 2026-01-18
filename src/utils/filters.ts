import type { BadgeEvent, FlagType, PersonBase } from "../data/types";
import { isAfterHours } from "./date";

export type DateRange = {
  start: string;
  end: string;
  label: string;
};

export type FilterState = {
  dateRange: DateRange;
  locations: string[];
  deviceIdQuery: string;
  personQuery: string;
  includeApproved: boolean;
  includeDenied: boolean;
  afterHoursOnly: boolean;
  flaggedOnly: boolean;
  anomalyRange: { min: number; max: number };
  includeZeroEvents: boolean;
  flags: FlagType[];
};

const parseLocalDate = (value: string) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month: month - 1, day };
};

export const getDateWindow = (range: DateRange) => {
  const startParts = parseLocalDate(range.start);
  const endParts = parseLocalDate(range.end);

  const start = startParts
    ? new Date(startParts.year, startParts.month, startParts.day, 0, 0, 0, 0).getTime()
    : null;
  const end = endParts
    ? new Date(endParts.year, endParts.month, endParts.day, 23, 59, 59, 999).getTime()
    : null;

  return { start, end };
};

export const filterEvents = (events: BadgeEvent[], filters: FilterState) => {
  const { start, end } = getDateWindow(filters.dateRange);
  const deviceQuery = filters.deviceIdQuery.trim().toLowerCase();

  const includeApproved = filters.includeApproved;
  const includeDenied = filters.includeDenied;
  if (!includeApproved && !includeDenied) return [];

  return events.filter((event) => {
    const time = new Date(event.timestamp).getTime();
    if (start !== null && time < start) return false;
    if (end !== null && time > end) return false;

    if (!includeApproved && event.outcome === "approved") return false;
    if (!includeDenied && event.outcome === "denied") return false;

    if (filters.afterHoursOnly && !isAfterHours(event.timestamp)) return false;
    if (filters.flaggedOnly && event.flags.length === 0) return false;

    if (filters.flags.length > 0) {
      const hasAllFlags = filters.flags.every((flag) => event.flags.includes(flag));
      if (!hasAllFlags) return false;
    }

    if (filters.locations.length > 0 && !filters.locations.includes(event.scannerId)) {
      return false;
    }

    if (deviceQuery && !event.deviceId.toLowerCase().includes(deviceQuery)) {
      return false;
    }

    return true;
  });
};

export const filterPeople = (people: PersonBase[], filters: FilterState) => {
  const query = filters.personQuery.trim().toLowerCase();
  if (!query) return people;
  return people.filter((person) => person.name.toLowerCase().includes(query));
};

export const normalizeAnomalyRange = (range: { min: number; max: number }) => {
  const min = Math.min(Math.max(range.min, 0), 100);
  const max = Math.min(Math.max(range.max, 0), 100);
  if (min <= max) return { min, max };
  return { min: max, max: min };
};
