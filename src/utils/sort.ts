import type { BadgeEvent } from "../data/types";

export const sortEventsByTimestampDesc = (events: BadgeEvent[]) => {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
};
