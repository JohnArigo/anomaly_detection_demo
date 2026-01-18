import type {
  BadgeEvent,
  DenialBreakdownModel,
  PersonBase,
  PersonProfile,
  PersonRollup,
  PersonnelSummary,
} from "./types";
import { filterEvents, filterPeople, type FilterState } from "../utils/filters";
import { sortEventsByTimestampDesc } from "../utils/sort";
import {
  denialReasonStats,
  flagStats,
  isolationForestScore,
  locationStats,
  rate,
  shannonEntropy,
  uniqueRatio,
} from "./metrics";
import { isAfterHours, isWeekend } from "../utils/date";
import { anomalyScoreFromIso } from "./metrics";

const deriveStatus = (params: {
  anomalyScore: number;
  denialPercent: number;
  afterHoursRate: number;
  rapidRepeatRate: number;
}) => {
  const reasons: string[] = [];
  if (params.denialPercent > 14) reasons.push("High denied rate");
  if (params.afterHoursRate > 18) reasons.push("After-hours surge");
  if (params.rapidRepeatRate > 8) reasons.push("Rapid repeat attempts");
  if (params.anomalyScore > 70) reasons.push("Anomaly score elevated");

  const statusLabel =
    params.anomalyScore > 75 || params.denialPercent > 18 ? "DELINQUENT" : "WATCH";
  return {
    statusLabel,
    reasons: reasons.length === 0 ? ["Within expected baseline"] : reasons,
  };
};

const hasTrainingOverdue = (score: number, denialPercent: number) => {
  return score > 68 || denialPercent > 16;
};

export const buildPersonProfile = (
  person: PersonBase,
  personEvents: BadgeEvent[],
  activeWindowLabel: string,
  fallbackTimestamp: string,
): PersonProfile => {
  const sortedEvents = sortEventsByTimestampDesc(personEvents);
  const totalEvents = sortedEvents.length;
  const approvedCount = sortedEvents.filter((event) => event.outcome === "approved").length;
  const deniedCount = sortedEvents.filter((event) => event.outcome === "denied").length;
  const denialPercent = rate(deniedCount, totalEvents);

  const afterHoursCount = sortedEvents.filter((event) => isAfterHours(event.timestamp)).length;
  const weekendCount = sortedEvents.filter((event) => isWeekend(event.timestamp)).length;
  const newLocationCount = sortedEvents.filter((event) => event.flags.includes("New Location")).length;
  const rapidRepeatCount = sortedEvents.filter((event) => event.flags.includes("Rapid Repeat")).length;

  const afterHoursRate = rate(afterHoursCount, totalEvents);
  const weekendRate = rate(weekendCount, totalEvents);
  const newLocationRate = rate(newLocationCount, totalEvents);
  const rapidRepeatRate = rate(rapidRepeatCount, totalEvents);

  const entropy = shannonEntropy(sortedEvents);
  const uniqueDeviceRatio = uniqueRatio(
    sortedEvents.map((event) => event.deviceId),
    totalEvents,
  );

  const isoScore = isolationForestScore({
    denialPercent,
    entropy,
    afterHoursRate,
    newLocationRate,
    rapidRepeatRate,
    uniqueDeviceRatio,
  });

  const anomalyScore = anomalyScoreFromIso(isoScore);
  const trainingOverdue = hasTrainingOverdue(anomalyScore, denialPercent);
  const status = deriveStatus({
    anomalyScore,
    denialPercent,
    afterHoursRate,
    rapidRepeatRate,
  });

  const statusReasons = [...status.reasons];
  if (trainingOverdue) statusReasons.push("Training overdue");

  return {
    id: person.id,
    name: person.name,
    anomalyScore,
    isolationForestScore: isoScore,
    shannonEntropy: entropy,
    approvedCount,
    deniedCount,
    scannerLocations: locationStats(sortedEvents),
    denialPercent,
    uniqueDeviceRatio,
    afterHoursRate,
    weekendRate,
    lastBadgeTimestamp: sortedEvents[0]?.timestamp ?? fallbackTimestamp,
    activeWindowLabel,
    totalEvents,
    denialReasons: denialReasonStats(sortedEvents),
    recentEvents: sortedEvents,
    topFlags: flagStats(sortedEvents, trainingOverdue),
    statusLabel: status.statusLabel,
    statusReasons,
  };
};

export const buildPersonRollup = (profile: PersonProfile): PersonRollup => {
  return {
    id: profile.id,
    name: profile.name,
    anomalyScore: profile.anomalyScore,
    isolationForestScore: profile.isolationForestScore,
    shannonEntropy: profile.shannonEntropy,
    denialPercent: profile.denialPercent,
    lastBadgeTimestamp: profile.lastBadgeTimestamp,
    activeWindowLabel: profile.activeWindowLabel,
    totalEvents: profile.totalEvents,
  };
};

export const buildDenialBreakdown = (profile: PersonProfile): DenialBreakdownModel => {
  return {
    totalDenied: profile.deniedCount,
    denialReasons: profile.denialReasons,
    topFlags: profile.topFlags,
    recentDeniedEvents: profile.recentEvents.filter((event) => event.outcome === "denied"),
  };
};

export const buildPersonnelSummary = (
  events: BadgeEvent[],
  profiles: PersonProfile[],
  activeWindowLabel: string,
): PersonnelSummary => {
  const afterHoursEvents = events.filter((event) => isAfterHours(event.timestamp));
  const afterHoursDays = new Set(
    afterHoursEvents.map((event) => event.timestamp.split("T")[0]),
  ).size;

  const totalEvents = profiles.reduce((sum, profile) => sum + profile.totalEvents, 0);
  const avgAnomaly =
    profiles.length === 0
      ? 0
      : profiles.reduce((sum, profile) => sum + profile.anomalyScore, 0) / profiles.length;

  return {
    totalPersonnel: profiles.length,
    totalEvents,
    avgAnomaly,
    afterHoursEvents: afterHoursEvents.length,
    afterHoursDays,
    activeWindowLabel,
  };
};

export const buildProfiles = (
  people: PersonBase[],
  events: BadgeEvent[],
  filters: FilterState,
) => {
  const filteredPeople = filterPeople(people, filters);
  const filteredEvents = filterEvents(events, filters);

  const profiles = filteredPeople.map((person) => {
    const personEvents = filteredEvents.filter((event) => event.personId === person.id);
    return buildPersonProfile(
      person,
      personEvents,
      filters.dateRange.label,
      filters.dateRange.end,
    );
  });

  const anomalyFiltered = profiles.filter(
    (profile) =>
      profile.anomalyScore >= filters.anomalyRange.min &&
      profile.anomalyScore <= filters.anomalyRange.max,
  );

  return {
    profiles: anomalyFiltered,
    summary: buildPersonnelSummary(filteredEvents, anomalyFiltered, filters.dateRange.label),
  };
};
