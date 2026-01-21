import type {
  BadgeEvent,
  DenialReason,
  DenialReasonStat,
  FlagStat,
  FlagType,
  LocationStat,
} from "./types";
import { clamp } from "../utils/math";

export const countBy = <T extends string>(items: T[]) => {
  const map = new Map<T, number>();
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return map;
};

export const locationStats = (events: BadgeEvent[]): LocationStat[] => {
  const map = new Map<string, { name: string; count: number }>();
  for (const event of events) {
    const current = map.get(event.scannerId);
    if (current) {
      current.count += 1;
    } else {
      map.set(event.scannerId, { name: event.scannerName, count: 1 });
    }
  }
  return Array.from(map.entries())
    .map(([locationId, value]) => ({
      locationId,
      displayName: value.name,
      count: value.count,
    }))
    .sort((a, b) => b.count - a.count);
};

export const denialReasonStats = (events: BadgeEvent[]): DenialReasonStat[] => {
  const reasons: DenialReason[] = events
    .filter((event) => event.outcome === "denied")
    .map((event) => event.denialReason ?? "Unknown");
  const counts = countBy(reasons);
  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
};

export const flagStats = (
  events: BadgeEvent[],
  includeTrainingOverdue: boolean
): FlagStat[] => {
  const flags: FlagType[] = [];
  for (const event of events) {
    flags.push(...event.flags);
  }
  if (includeTrainingOverdue) {
    flags.push("Training Overdue");
  }
  const counts = countBy(flags);
  return Array.from(counts.entries())
    .map(([flag, count]) => ({ flag, count }))
    .sort((a, b) => b.count - a.count);
};

export const shannonEntropy = (events: BadgeEvent[]) => {
  if (events.length === 0) return 0;
  const counts = countBy(events.map((event) => event.scannerId));
  const total = events.length;
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};

export const rate = (count: number, total: number) =>
  total === 0 ? 0 : (count / total) * 100;

export const uniqueRatio = (values: string[], total: number) => {
  if (total === 0) return 0;
  const unique = new Set(values).size;
  return unique / total;
};

export const isolationForestScore = (params: {
  denialPercent: number;
  entropy: number;
  afterHoursRate: number;
  newLocationRate: number;
  rapidRepeatRate: number;
  uniqueDeviceRatio: number;
}) => {
  const entropyNorm = clamp(params.entropy / 3.2, 0, 1);
  const denialNorm = clamp(params.denialPercent / 45, 0, 1);
  const afterHoursNorm = clamp(params.afterHoursRate / 40, 0, 1);
  const newLocationNorm = clamp(params.newLocationRate / 25, 0, 1);
  const rapidNorm = clamp(params.rapidRepeatRate / 20, 0, 1);
  const deviceNorm = clamp(params.uniqueDeviceRatio, 0, 1);

  const weighted =
    denialNorm * 0.28 +
    entropyNorm * 0.2 +
    afterHoursNorm * 0.18 +
    newLocationNorm * 0.14 +
    rapidNorm * 0.12 +
    deviceNorm * 0.08;

  return clamp(weighted * 10, 0, 10);
};

export const anomalyScoreFromIso = (isoScore: number) => {
  return clamp((isoScore - 5) / 5, -1, 1);
};
