import type { BadgeEvent, PersonBase, PersonProfile } from "./types";
import { createDefaultFilters } from "../utils/range";
import { filterEvents } from "../utils/filters";
import { buildPersonProfile } from "./rollups";
import { baseNow } from "./mock";

export const getPersonById = (
  personId: string | null,
  people: PersonBase[],
  events: BadgeEvent[],
): PersonProfile | null => {
  if (!personId) return null;
  const person = people.find((item) => item.id === personId);
  if (!person) return null;

  const filters = createDefaultFilters(baseNow);
  const filteredEvents = filterEvents(events, filters).filter(
    (event) => event.personId === personId,
  );

  return buildPersonProfile(person, filteredEvents, filters.dateRange.label, filters.dateRange.end);
};
