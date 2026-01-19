import { mulberry32, seedFromString } from "./seed";
import type { BadgeEvent, DenialReason, FlagType, PersonBase } from "./types";
import { isAfterHours, isWeekend } from "../utils/date";
import { clamp } from "../utils/math";
import { buildMonthlySummaries, toMonthKey } from "./monthly";

export const PERSON_COUNT = 100;

export const scanners = [
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

export const baseNow = new Date("2026-01-28T12:00:00Z");
export const defaultMonthKey = toMonthKey(baseNow.toISOString());

const firstNames = [
  "Avery",
  "Malik",
  "Priya",
  "Sofia",
  "Omar",
  "Hannah",
  "Emilio",
  "Noah",
  "Ivy",
  "Declan",
  "Lena",
  "Kai",
  "Morgan",
  "Ravi",
  "Zoe",
  "Elias",
  "Nia",
  "Aria",
  "Felix",
  "Quinn",
  "Jules",
  "Amina",
  "Levi",
  "Mae",
  "Caleb",
  "Nora",
  "Tariq",
  "June",
  "Mira",
  "Hugo",
];

const lastNames = [
  "Chen",
  "Johnson",
  "Nayar",
  "Alvarez",
  "Rahman",
  "Park",
  "Torres",
  "Bennett",
  "Thompson",
  "Wu",
  "Patel",
  "Klein",
  "Sato",
  "Cruz",
  "Brooks",
  "Hassan",
  "Nguyen",
  "Ibrahim",
  "Kim",
  "Murphy",
  "Holt",
  "Mejia",
  "Owens",
  "Singh",
  "Diaz",
  "Olsen",
  "Baker",
  "Hsu",
  "Roman",
  "Kaur",
];

type Cohort = "delinquent" | "watch" | "very-normal" | "typical";

type Traits = {
  denialBias: number;
  afterHoursBias: number;
  weekendBias: number;
  entropyBias: number;
  newLocationBias: number;
  rapidRepeatBias: number;
  deviceVariance: number;
  forceNoDenied?: boolean;
  eventMin: number;
  eventMax: number;
};

const cohortForIndex = (index: number): Cohort => {
  if (index < 4) return "delinquent";
  if (index < 24) return "watch";
  if (index < 36) return "very-normal";
  return "typical";
};

const baseTraits: Record<Cohort, Traits> = {
  delinquent: {
    denialBias: 0.24,
    afterHoursBias: 0.22,
    weekendBias: 0.2,
    entropyBias: 0.5,
    newLocationBias: 0.35,
    rapidRepeatBias: 0.2,
    deviceVariance: 0.8,
    eventMin: 220,
    eventMax: 320,
  },
  watch: {
    denialBias: 0.14,
    afterHoursBias: 0.14,
    weekendBias: 0.12,
    entropyBias: 0.32,
    newLocationBias: 0.22,
    rapidRepeatBias: 0.14,
    deviceVariance: 0.55,
    eventMin: 160,
    eventMax: 240,
  },
  "very-normal": {
    denialBias: -0.1,
    afterHoursBias: 0.02,
    weekendBias: 0.03,
    entropyBias: 0.08,
    newLocationBias: 0.05,
    rapidRepeatBias: 0.03,
    deviceVariance: 0.18,
    eventMin: 60,
    eventMax: 120,
    forceNoDenied: true,
  },
  typical: {
    denialBias: 0.05,
    afterHoursBias: 0.08,
    weekendBias: 0.07,
    entropyBias: 0.2,
    newLocationBias: 0.12,
    rapidRepeatBias: 0.08,
    deviceVariance: 0.35,
    eventMin: 120,
    eventMax: 200,
  },
};

const jitter = (rng: () => number, value: number, spread: number) => {
  return clamp(value + (rng() - 0.5) * spread, 0, 0.5);
};

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
  for (let i = 0; i < 28; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    if (isWeekend(date)) offsets.push(i);
  }
  return offsets.length === 0 ? randomInt(rng, 0, 27) : pick(rng, offsets);
};

const generateEvents = (personId: string, seed: number, traits: Traits) => {
  const rng = mulberry32(seed);
  const now = new Date(baseNow);
  const totalEvents = randomInt(rng, traits.eventMin, traits.eventMax);
  const preferredLocations = pickUnique(rng, scanners, 3).map((scanner) => scanner.id);

  const devicePoolSize = clamp(Math.round(8 + traits.deviceVariance * 30), 4, 40);
  const devicePool = Array.from(
    { length: devicePoolSize },
    (_, idx) => `DEV-${personId}-${idx}`,
  );

  const events: BadgeEvent[] = [];

  for (let i = 0; i < totalEvents; i += 1) {
    const useWeekend = rng() < traits.weekendBias;
    const dayOffset = useWeekend ? findWeekendOffset(rng, now) : randomInt(rng, 0, 27);
    const date = new Date(now);
    date.setDate(now.getDate() - dayOffset);

    const afterHoursTarget = 0.06 + traits.afterHoursBias;
    const isAfter = rng() < afterHoursTarget;
    if (isAfter) {
      const hour = rng() < 0.5 ? randomInt(rng, 0, 5) : randomInt(rng, 19, 23);
      date.setHours(hour, randomInt(rng, 0, 59), randomInt(rng, 0, 59), 0);
    } else {
      date.setHours(
        randomInt(rng, 7, 18),
        randomInt(rng, 0, 59),
        randomInt(rng, 0, 59),
        0,
      );
    }

    const isPreferred = rng() < 0.72;
    const location = isPreferred
      ? pick(rng, scanners.filter((scanner) => preferredLocations.includes(scanner.id)))
      : pick(rng, scanners);

    const baseRate = clamp(0.04 + traits.denialBias, 0, 0.6);
    const denied = traits.forceNoDenied ? false : rng() < baseRate;
    const flags: FlagType[] = [];
    if (isAfterHours(date)) flags.push("After-Hours");

    if (!preferredLocations.includes(location.id) && rng() < 0.22 + traits.newLocationBias) {
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

  const chron = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  for (let i = 1; i < chron.length; i += 1) {
    const prev = chron[i - 1];
    const current = chron[i];
    const diff = new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime();
    if (diff <= 2 * 60 * 1000 && rng() < traits.rapidRepeatBias + 0.1) {
      if (!current.flags.includes("Rapid Repeat")) current.flags.push("Rapid Repeat");
    }
  }

  return events;
};

const buildName = (index: number) => {
  const first = firstNames[index % firstNames.length];
  const lastIndex = Math.floor(index / firstNames.length) % lastNames.length;
  const last = lastNames[lastIndex];
  const baseName = `${first} ${last}`;
  const suffixIndex = Math.floor(index / (firstNames.length * lastNames.length));
  return suffixIndex > 0 ? `${baseName} ${suffixIndex + 1}` : baseName;
};

export const peopleBase: PersonBase[] = Array.from({ length: PERSON_COUNT }, (_, index) => {
  const id = `p-${String(index + 1).padStart(3, "0")}`;
  return {
    id,
    name: buildName(index),
  };
});

const traitsByPerson = peopleBase.map((person, index) => {
  const rng = mulberry32(seedFromString(person.id));
  const cohort = cohortForIndex(index);
  const base = baseTraits[cohort];
  return {
    denialBias: jitter(rng, base.denialBias, 0.08),
    afterHoursBias: jitter(rng, base.afterHoursBias, 0.08),
    weekendBias: jitter(rng, base.weekendBias, 0.06),
    entropyBias: jitter(rng, base.entropyBias, 0.1),
    newLocationBias: jitter(rng, base.newLocationBias, 0.08),
    rapidRepeatBias: jitter(rng, base.rapidRepeatBias, 0.06),
    deviceVariance: clamp(base.deviceVariance + (rng() - 0.5) * 0.2, 0.1, 0.9),
    forceNoDenied: base.forceNoDenied,
    eventMin: base.eventMin,
    eventMax: base.eventMax,
  } as Traits;
});

export const badgeEvents: BadgeEvent[] = peopleBase.flatMap((person, index) =>
  generateEvents(person.id, seedFromString(person.id), traitsByPerson[index]),
);

export const monthlySummaries = buildMonthlySummaries(
  peopleBase,
  badgeEvents,
  defaultMonthKey,
);
