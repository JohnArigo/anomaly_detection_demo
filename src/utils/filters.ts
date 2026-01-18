import type { BadgeEvent, FlagType, Outcome, PersonBase } from "../data/types";

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
  outcome: Outcome | "all";
  flags: FlagType[];
  anomalyRange: { min: number; max: number };
};

export const filterEvents = (events: BadgeEvent[], filters: FilterState) => {
  const start = new Date(filters.dateRange.start).getTime();
  const end = new Date(filters.dateRange.end).getTime();
  const deviceQuery = filters.deviceIdQuery.trim().toLowerCase();

  return events.filter((event) => {
    const time = new Date(event.timestamp).getTime();
    if (Number.isFinite(start) && time < start) return false;
    if (Number.isFinite(end) && time > end) return false;

    if (filters.locations.length > 0 && !filters.locations.includes(event.scannerId)) {
      return false;
    }

    if (filters.outcome !== "all" && event.outcome !== filters.outcome) {
      return false;
    }

    if (filters.flags.length > 0) {
      const hasAllFlags = filters.flags.every((flag) => event.flags.includes(flag));
      if (!hasAllFlags) return false;
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
