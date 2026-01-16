import { mulberry32, seedFromString } from "./seed";
import type {
  BadgeEvent,
  DenialReason,
  FlagType,
  PersonProfile,
} from "./types";
import {
  anomalyScoreFromIso,
  denialReasonStats,
  flagStats,
  isolationForestScore,
  locationStats,
  rate,
  shannonEntropy,
  uniqueRatio,
} from "./metrics";
import { isAfterHours, isWeekend } from "../utils/date";
import { clamp } from "../utils/math";

const scanners = [
  { id: "SC-100", name: "HQ North Lobby" },
  { id: "SC-101", name: "HQ South Lobby" },
  { id: "SC-102", name: "Annex 2F West" },
  { id: "SC-103", name: "R&D East Bay" },
  { id: "SC-104", name: "Ops Warehouse" },
  { id: "SC-105", name: "Data Center A" },
  { id: "SC-106", name: "Parking Gate 3" },
  { id: "SC-107", name: "Training Wing" },
  { id: "SC-108", name: "Remote Intake" },
  { id: "SC-109", name: "HQ Level 5" },
];

const baseNow = new Date("2024-02-15T12:00:00Z");

const peopleSeeds = [
  {
    id: "p-01",
    name: "Avery Chen",
    traits: {
      denialBias: 0.8,
      afterHoursBias: 0.18,
      weekendBias: 0.15,
      entropyBias: 0.4,
      newLocationBias: 0.2,
      rapidRepeatBias: 0.12,
      deviceVariance: 0.6,
    },
  },
  {
    id: "p-02",
    name: "Malik Johnson",
    traits: {
      denialBias: 0.02,
      afterHoursBias: 0.04,
      weekendBias: 0.08,
      entropyBias: 0.1,
      newLocationBias: 0.05,
      rapidRepeatBias: 0.04,
      deviceVariance: 0.2,
    },
  },
  {
    id: "p-03",
    name: "Priya Nayar",
    traits: {
      denialBias: 0.05,
      afterHoursBias: 0.2,
      weekendBias: 0.25,
      entropyBias: 0.5,
      newLocationBias: 0.3,
      rapidRepeatBias: 0.16,
      deviceVariance: 0.7,
    },
  },
  {
    id: "p-04",
    name: "Sofia Alvarez",
    traits: {
      denialBias: 0.01,
      afterHoursBias: 0.06,
      weekendBias: 0.05,
      entropyBias: 0.2,
      newLocationBias: 0.08,
      rapidRepeatBias: 0.04,
      deviceVariance: 0.15,
    },
  },
  {
    id: "p-05",
    name: "Omar Rahman",
    traits: {
      denialBias: 0.1,
      afterHoursBias: 0.12,
      weekendBias: 0.18,
      entropyBias: 0.3,
      newLocationBias: 0.15,
      rapidRepeatBias: 0.2,
      deviceVariance: 0.45,
    },
  },
  {
    id: "p-06",
    name: "Hannah Park",
    traits: {
      denialBias: 0.03,
      afterHoursBias: 0.05,
      weekendBias: 0.07,
      entropyBias: 0.15,
      newLocationBias: 0.12,
      rapidRepeatBias: 0.06,
      deviceVariance: 0.25,
    },
  },
  {
    id: "p-07",
    name: "Emilio Torres",
    traits: {
      denialBias: 0.07,
      afterHoursBias: 0.16,
      weekendBias: 0.12,
      entropyBias: 0.35,
      newLocationBias: 0.25,
      rapidRepeatBias: 0.14,
      deviceVariance: 0.55,
    },
  },
  {
    id: "p-08",
    name: "Noah Bennett",
    traits: {
      denialBias: 0.04,
      afterHoursBias: 0.08,
      weekendBias: 0.06,
      entropyBias: 0.18,
      newLocationBias: 0.1,
      rapidRepeatBias: 0.05,
      deviceVariance: 0.35,
    },
  },
  {
    id: "p-09",
    name: "Ivy Thompson",
    traits: {
      denialBias: 0.06,
      afterHoursBias: 0.22,
      weekendBias: 0.2,
      entropyBias: 0.45,
      newLocationBias: 0.3,
      rapidRepeatBias: 0.18,
      deviceVariance: 0.65,
    },
  },
  {
    id: "p-10",
    name: "Declan Wu",
    traits: {
      denialBias: 0.02,
      afterHoursBias: 0.05,
      weekendBias: 0.03,
      entropyBias: 0.1,
      newLocationBias: 0.08,
      rapidRepeatBias: 0.05,
      deviceVariance: 0.2,
    },
  },
];

const pick = <T>(rng: () => number, list: T[]) => {
  return list[Math.floor(rng() * list.length)];
};

const pickUnique = <T>(rng: () => number, list: T[], count: number) => {
  const copy = [...list];
  const picked: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i += 1) {
    const index = Math.floor(rng() * copy.length);
    picked.push(copy.splice(index, 1)[0]);
  }
  return picked;
};

const randomInt = (rng: () => number, min: number, max: number) => {
  return Math.floor(rng() * (max - min + 1)) + min;
};

const weightedReason = (rng: () => number): DenialReason => {
  const roll = rng();
  if (roll < 0.32) return "Expired Badge";
  if (roll < 0.56) return "Time Restricted";
  if (roll < 0.78) return "Invalid Entry Code";
  return "No Access";
};

const findWeekendOffset = (rng: () => number, now: Date) => {
  const offsets: number[] = [];
  for (let i = 0; i < 30; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    if (isWeekend(date)) offsets.push(i);
  }
  return offsets.length === 0 ? randomInt(rng, 0, 29) : pick(rng, offsets);
};

const generateEvents = (
  personId: string,
  seed: number,
  traits: (typeof peopleSeeds)[number]["traits"]
) => {
  const rng = mulberry32(seed);
  const now = new Date(baseNow);
  const totalEvents = randomInt(rng, 120, 210);
  const preferredLocations = pickUnique(rng, scanners, 3).map(
    (scanner) => scanner.id
  );

  const devicePoolSize = clamp(
    Math.round(12 + traits.deviceVariance * 25),
    8,
    40
  );
  const devicePool = Array.from(
    { length: devicePoolSize },
    (_, idx) => `DEV-${personId}-${idx}`
  );

  const events: BadgeEvent[] = [];

  for (let i = 0; i < totalEvents; i += 1) {
    const useWeekend = rng() < traits.weekendBias;
    const dayOffset = useWeekend
      ? findWeekendOffset(rng, now)
      : randomInt(rng, 0, 29);
    const date = new Date(now);
    date.setDate(now.getDate() - dayOffset);

    const afterHoursTarget = 0.08 + traits.afterHoursBias;
    const isAfter = rng() < afterHoursTarget;
    if (isAfter) {
      const hour = rng() < 0.5 ? randomInt(rng, 0, 5) : randomInt(rng, 19, 23);
      date.setHours(hour, randomInt(rng, 0, 59), randomInt(rng, 0, 59), 0);
    } else {
      date.setHours(
        randomInt(rng, 7, 18),
        randomInt(rng, 0, 59),
        randomInt(rng, 0, 59),
        0
      );
    }

    const isPreferred = rng() < 0.72;
    const location = isPreferred
      ? pick(
          rng,
          scanners.filter((scanner) => preferredLocations.includes(scanner.id))
        )
      : pick(rng, scanners);

    const denialRate = clamp(0.06 + traits.denialBias, 0.01, 0.45);
    const denied = rng() < denialRate;
    const flags: FlagType[] = [];
    if (isAfterHours(date)) flags.push("After-Hours");

    if (
      !preferredLocations.includes(location.id) &&
      rng() < 0.25 + traits.newLocationBias
    ) {
      flags.push("New Location");
    }

    events.push({
      id: `${personId}-evt-${i}`,
      personId,
      timestamp: date.toISOString(),
      scannerId: location.id,
      scannerName: location.name,
      outcome: denied ? "denied" : "approved",
      denialReason: denied ? weightedReason(rng) : undefined,
      flags,
      deviceId: pick(rng, devicePool),
    });
  }

  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const chron = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (let i = 1; i < chron.length; i += 1) {
    const prev = chron[i - 1];
    const current = chron[i];
    const diff =
      new Date(current.timestamp).getTime() -
      new Date(prev.timestamp).getTime();
    if (diff <= 2 * 60 * 1000 && rng() < traits.rapidRepeatBias + 0.1) {
      if (!current.flags.includes("Rapid Repeat"))
        current.flags.push("Rapid Repeat");
    }
  }

  return events;
};

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
    params.anomalyScore > 75 || params.denialPercent > 18 ? "ALERT" : "WATCH";
  return {
    statusLabel,
    reasons: reasons.length === 0 ? ["Within expected baseline"] : reasons,
  };
};

export const generatePeople = () => {
  const people: PersonProfile[] = peopleSeeds.map((seed) => {
    const rng = mulberry32(seedFromString(seed.id));
    const events = generateEvents(
      seed.id,
      seedFromString(seed.id),
      seed.traits
    );
    const totalEvents = events.length;
    const approvedCount = events.filter(
      (event) => event.outcome === "approved"
    ).length;
    const deniedCount = events.filter(
      (event) => event.outcome === "denied"
    ).length;
    const denialPercent = rate(deniedCount, totalEvents);

    const afterHoursCount = events.filter((event) =>
      isAfterHours(event.timestamp)
    ).length;
    const weekendCount = events.filter((event) =>
      isWeekend(event.timestamp)
    ).length;
    const newLocationCount = events.filter((event) =>
      event.flags.includes("New Location")
    ).length;
    const rapidRepeatCount = events.filter((event) =>
      event.flags.includes("Rapid Repeat")
    ).length;

    const afterHoursRate = rate(afterHoursCount, totalEvents);
    const weekendRate = rate(weekendCount, totalEvents);
    const newLocationRate = rate(newLocationCount, totalEvents);
    const rapidRepeatRate = rate(rapidRepeatCount, totalEvents);

    const entropy = shannonEntropy(events) + seed.traits.entropyBias;

    const uniqueDeviceRatio = uniqueRatio(
      events.map((event) => event.deviceId),
      totalEvents
    );

    const isoScore = isolationForestScore({
      denialPercent,
      entropy,
      afterHoursRate,
      newLocationRate,
      rapidRepeatRate,
      uniqueDeviceRatio,
    });

    const anomalyScore = anomalyScoreFromIso(
      isoScore + seed.traits.denialBias * 10
    );

    const trainingOverdue = rng() < 0.35 && anomalyScore > 60;
    const status = deriveStatus({
      anomalyScore,
      denialPercent,
      afterHoursRate,
      rapidRepeatRate,
    });

    const statusReasons = [...status.reasons];
    if (trainingOverdue) statusReasons.push("Training overdue");

    return {
      id: seed.id,
      name: seed.name,
      anomalyScore,
      isolationForestScore: isoScore,
      shannonEntropy: entropy,
      approvedCount,
      deniedCount,
      scannerLocations: locationStats(events),
      denialPercent,
      uniqueDeviceRatio,
      afterHoursRate,
      weekendRate,
      lastBadgeTimestamp: events[0]?.timestamp ?? baseNow.toISOString(),
      activeWindowLabel: "Last 30d",
      totalEvents,
      denialReasons: denialReasonStats(events),
      recentEvents: events,
      topFlags: flagStats(events, trainingOverdue),
      statusLabel: status.statusLabel,
      statusReasons,
    };
  });

  return people;
};

export const people = generatePeople();
