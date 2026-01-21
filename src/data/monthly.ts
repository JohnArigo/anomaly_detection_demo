import type { BadgeEvent, DenialReason, MonthlyPersonSummary, PersonBase } from "./types";
import {
  anomalyScoreFromIso,
  denialReasonStats,
  isolationForestScore,
  rate,
  shannonEntropy,
  uniqueRatio,
} from "./metrics";
import { isAfterHours, isWeekend } from "../utils/date";

export const toMonthKey = (iso: string) => {
  const date = new Date(iso);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

export const listMonthKeys = (events: BadgeEvent[]) => {
  const keys = new Set<string>();
  for (const event of events) {
    keys.add(toMonthKey(event.timestamp));
  }
  return Array.from(keys).sort((a, b) => {
    const [ay, am] = a.split("-").map((value) => Number(value));
    const [by, bm] = b.split("-").map((value) => Number(value));
    return by * 100 + bm - (ay * 100 + am);
  });
};

const stdDev = (values: number[]) => {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const countRapidBadging = (events: BadgeEvent[]) => {
  if (events.length < 3) return 0;
  const times = events
    .map((event) => new Date(event.timestamp).getTime())
    .sort((a, b) => a - b);
  let count = 0;
  for (let i = 0; i < times.length - 2; i += 1) {
    if (times[i + 2] - times[i] <= 15000) {
      count += 1;
    }
  }
  return count;
};

const getBadgedDays = (events: BadgeEvent[]) => {
  const days = new Set<number>();
  for (const event of events) {
    const day = new Date(event.timestamp).getUTCDate();
    days.add(day);
  }
  return Array.from(days).sort((a, b) => a - b);
};

const fallbackTimestamp = (monthKey: string) => `${monthKey}-01T00:00:00Z`;

export const buildMonthlySummaries = (
  people: PersonBase[],
  events: BadgeEvent[],
  monthKey: string,
): MonthlyPersonSummary[] => {
  const monthEvents = events.filter((event) => toMonthKey(event.timestamp) === monthKey);
  const eventsByPerson = new Map<string, BadgeEvent[]>();
  for (const event of monthEvents) {
    const list = eventsByPerson.get(event.personId);
    if (list) {
      list.push(event);
    } else {
      eventsByPerson.set(event.personId, [event]);
    }
  }

  return people.map((person) => {
    const personEvents = eventsByPerson.get(person.id) ?? [];
    const sorted = [...personEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const totalEvents = sorted.length;
    const acceptedCount = sorted.filter((event) => event.outcome === "approved").length;
    const deniedCount = sorted.filter((event) => event.outcome === "denied").length;
    const deniedRate = rate(deniedCount, totalEvents);
    const afterHoursCount = sorted.filter((event) => isAfterHours(event.timestamp)).length;
    const weekendCount = sorted.filter((event) => isWeekend(event.timestamp)).length;
    const afterHoursRate = rate(afterHoursCount, totalEvents);
    const weekendRate = rate(weekendCount, totalEvents);

    const entropy = shannonEntropy(sorted);
    const uniqueDeviceRatio = uniqueRatio(
      sorted.map((event) => event.deviceId),
      totalEvents,
    );

    const newLocationCount = sorted.filter((event) => event.flags.includes("New Location")).length;
    const rapidRepeatCount = sorted.filter((event) => event.flags.includes("Rapid Repeat")).length;
    const newLocationRate = rate(newLocationCount, totalEvents);
    const rapidRepeatRate = rate(rapidRepeatCount, totalEvents);

    const isoScore = isolationForestScore({
      denialPercent: deniedRate,
      entropy,
      afterHoursRate,
      newLocationRate,
      rapidRepeatRate,
      uniqueDeviceRatio,
    });

    const uniqueDevices = Array.from(new Set(sorted.map((event) => event.deviceId))).sort();
    const deviceCounts = uniqueDevices.map(
      (deviceId) => sorted.filter((event) => event.deviceId === deviceId).length,
    );

    return {
      personId: person.id,
      name: person.name,
      monthKey,
      lastEventTimestamp: sorted[0]?.timestamp ?? fallbackTimestamp(monthKey),
      anomalyScore: anomalyScoreFromIso(isoScore),
      isAnomaly: person.isAnomaly,
      shannonEntropy: entropy,
      deniedRate,
      weekendRate,
      afterHoursRate,
      uniqueDeviceStdDev: stdDev(deviceCounts),
      uniqueDeviceCount: uniqueDevices.length,
      uniqueDevices,
      denialReasons: denialReasonStats(sorted),
      totalEvents,
      acceptedCount,
      deniedCount,
      rapidBadgingCount: countRapidBadging(sorted),
      badgedDays: getBadgedDays(sorted),
    };
  });
};

export const getMonthlyRow = (
  personId: string | null,
  monthKey: string,
  people: PersonBase[],
  events: BadgeEvent[],
): MonthlyPersonSummary | null => {
  if (!personId) return null;
  const rows = buildMonthlySummaries(people, events, monthKey);
  return rows.find((row) => row.personId === personId) ?? null;
};

export const denialReasonOptions: DenialReason[] = [
  "Expired Badge",
  "Time Restricted",
  "Invalid Entry Code",
  "No Access",
  "Unknown",
];
