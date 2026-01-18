import type { BadgeEvent, PersonRollup } from "../data/types";

export const sortEventsByTimestampDesc = (events: BadgeEvent[]) => {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
};

export type RollupSortKey =
  | "name"
  | "anomalyScore"
  | "isolationForestScore"
  | "shannonEntropy"
  | "denialPercent"
  | "lastBadgeTimestamp";

export type SortDirection = "asc" | "desc";

export const sortRollups = (
  rollups: PersonRollup[],
  key: RollupSortKey,
  direction: SortDirection,
) => {
  const dir = direction === "asc" ? 1 : -1;
  return [...rollups].sort((a, b) => {
    if (key === "name") {
      return a.name.localeCompare(b.name) * dir;
    }
    if (key === "lastBadgeTimestamp") {
      return (
        (new Date(a.lastBadgeTimestamp).getTime() -
          new Date(b.lastBadgeTimestamp).getTime()) *
        dir
      );
    }
    return (a[key] - b[key]) * dir;
  });
};
